import App from '../../App'
import {Streamer} from "../../entity/Streamer";
import {arr, enumStr, nullable, num, obj, str} from 'json-schema-blocks'
import {publicEventLinkSchema} from '../../common/schema/commonEventSchema'
import {PaymentProviders, PaymentStatus} from '../../entity/Payment'

const app = App.getInstance()

export default function (router, opts, next) {

    router.get('/:slug',
        {
            schema: {
                description: 'Get streamer page by slug',
                params: obj({
                    slug: str(1),
                }),
                response: {
                    200: obj({
                        streamer: obj({
                            slug: str(),
                            name: str(),
                            title: str(),
                            avatarUrl: str(),
                            smm: obj({
                                insta: str(),
                                fb: str(),
                            }, {
                                required: []
                            }),
                            buttons: arr(
                                obj({
                                    label: str(),
                                    url: str(),
                                }),
                            ),
                            achievements: str(),
                        }),
                    }),
                },
            },
        },
        async (req, resp) => {
            const slug = String(req.params.slug);

            const streamer = await app.dbm.findOneOrFail(Streamer, {
                where: {
                    slug,
                },
            });

            resp.send({streamer});
        });

    router.get('/:slug/recommended',
        {
            schema: {
                description: 'List recommended & next streams',
                params: obj({
                    slug: str(1),
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
            const slug = String(req.params.slug);

            const result = await app.recommendationsService.getSerializedRecommendationsByStreamerSlug(slug);

            resp.send(result);
        });


    router.get('/:slug/donationFrame',
        {
            schema: {
                description: '',
                params: obj({
                    slug: str(1),
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
            const slug = String(req.params.slug);
            const donationAmount = Number(req.query.donationAmount);
            const screenName = String(req.query.screenName);
            const donationQuestion = req.query.donationQuestion ? String(req.query.donationQuestion) : '';
            const isPrivate = req.query.private === 'true';

            const streamer = await app.dbm.findOneOrFail(Streamer, {
                where: {
                    slug,
                },
                relations: ['user'],
            });
            const user = streamer.user;

            const payment = await app.paymentsService.newDonationPaymentStreamer(donationAmount, {
                paymentProvider: PaymentProviders.StripeConnect,
                streamer,
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
                        speakerName: streamer.name,
                        donationAmount,
                        stripePublicKey: app.env.stripePublicKey,
                        stripeAccountId: user.stripeAccountId,
                        client_secret: paymentIntent.client_secret,
                    },
                    {async: true},
                ));
        });

    next()
}
