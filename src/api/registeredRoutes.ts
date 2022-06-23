import App from '../App'
import assert from 'assert'
import {EventRegistration} from '../entity/EventRegistration'
import {PaymentProviders, PaymentStatus} from '../entity/Payment'
import {arr, enumStr, nullable, num, obj, str} from 'json-schema-blocks'
import {EventRecommendation, EventRecommendationTypes} from '../entity/EventRecommendation'
import {publicEventLinkSchema} from '../common/schema/commonEventSchema'
import {Streamer} from '../entity/Streamer'
import {Column, Index} from 'typeorm'

const app = App.getInstance()

async function eventRegistrationByRegSecret(regSecret: string): Promise<EventRegistration> {
    assert(regSecret, 'Registration secret is required');

    return await app.dbm.findOneOrFail(EventRegistration, {
        where: {
            secret: regSecret,
        },
        relations: ['event', 'event.user'],
    });
}

export default function (router, opts, next) {

    router.get('/:regSecret/streamer',
        {
            schema: {
                description: 'Get streamer page by regSecret',
                params: obj({
                    regSecret: str(1),
                }),
                response: {
                    200: obj({
                        streamer: nullable(obj({
                            slug: str(),
                            name: str(),
                            title: str(),
                            avatarUrl: str(),
                            smm: obj({
                                insta: str(),
                                fb: str()
                            }, {
                                required: []
                            }),
                            buttons: arr(
                                obj({
                                    label: str(),
                                    url: str(),
                                })
                            ),
                            achievements: str(),
                        }))
                    })
                }
            },
        },
        async (req, resp) => {
            const regSecret = String(req.params.regSecret);
            const eventRegistration = await eventRegistrationByRegSecret(regSecret);
            const event = eventRegistration.event;

            const streamer = await app.dbm.findOne(Streamer, {
                where: {
                    userId: event.userId,
                },
                order: {
                    id: 'DESC'
                }
            });

            resp.send({streamer});
        });

    router.get('/:regSecret/recommended',
        {
            schema: {
                description: 'List recommended & next streams',
                params: obj({
                    regSecret: str(1),
                }),
                response: {
                    200: obj({
                        myEvents: arr(publicEventLinkSchema),
                        recommendedEvents: arr(publicEventLinkSchema),
                    }),
                },
            },
        },
        async (req, resp) => {
            const eventRegistration = await eventRegistrationByRegSecret(String(req.params.regSecret));
            const event = eventRegistration.event;

            const result = await app.recommendationsService.getSerializedRecommendationsByEvent(event);

            resp.send(result);
        });

    router.get('/:regSecret/donationFrame',
        {
            schema: {
                description: 'Password recovery: request secret code',
                params: obj({
                    regSecret: str(1),
                }),
                query: obj({
                    donationAmount: num(),
                    screenName: str(),
                    donationQuestion: str(),
                    private: enumStr('true', 'false'),
                }, {optional: ['screenName', 'donationQuestion', 'private']}),
            },
        },
        async (req, reply) => {
            const regSecret = String(req.params.regSecret);
            const donationAmount = Number(req.query.donationAmount);
            const screenName = String(req.query.screenName);
            const donationQuestion = req.query.donationQuestion ? String(req.query.donationQuestion) : '';
            const isPrivate = req.query.private === 'true';

            const eventRegistration = await eventRegistrationByRegSecret(regSecret);
            const event = eventRegistration.event;

            const user = eventRegistration.event.user;

            if (!eventRegistration.screenName && screenName) {
                eventRegistration.screenName = screenName;
                await app.dbm.save(eventRegistration);
            }

            const payment = await app.paymentsService.newDonationPayment(donationAmount, {
                paymentProvider: PaymentProviders.StripeConnect,
                eventRegistration,
            });

            const paymentIntent = await app.stripeConnectService.paymentIntent({
                amount: payment.amount,
                fee_amount: payment.feeAmount,
            }, {
                stripeAccountId: user.stripeAccountId,
            });

            console.log(paymentIntent)

            payment.status = PaymentStatus.Created;
            payment.paymentProviderId = paymentIntent.id;
            payment.paymentProviderResponse = paymentIntent;
            payment.screenName = screenName;
            payment.donationQuestion = donationQuestion;
            payment.isPrivate = isPrivate;
            await app.dbm.save(payment);

            reply
                .type('text/html')
                .send(await app.ejs.renderFile(
                    `${app.dirService.rootDir}/src/templates/stripe/donatePayment.html.ejs`,
                    {
                        speakerName: event.speakerName,
                        donationAmount,
                        stripePublicKey: app.env.stripePublicKey,
                        stripeAccountId: user.stripeAccountId,
                        client_secret: paymentIntent.client_secret,
                    },
                    {async: true},
                ));
        });

    next();
}
