import App from '../../App';
import {StatusCodes} from '../../lib/StatusCodes';
import assert from 'assert';
import {EventRegistration} from '../../entity/EventRegistration';
import {obj, str} from 'json-schema-blocks'
import {Mailgun} from 'mailgun-js'
const mailgun = require("mailgun-js");

const app = App.getInstance();

export default function (router, opts, next) {

    router.get('/remind', async (req, reply) => {
        const userId = app.AuthService.getUserId(req.session)
        if (!userId) {
            return reply.code(403).send({
                error: 'User not authenticated'
            })
        }

        if (!await app.AccessModule.canUserId(EventRegistration, userId, 'create', null)) {
            return reply
                .code(StatusCodes.FORBIDDEN)
                .send({error: 'Access denied'})
        }

        const eventRegistrationId = req.query.eventRegistrationId;
        assert(eventRegistrationId, 'eventRegistrationId is required');

        const eventRegistration = await app.dbm.findOneOrFail(EventRegistration, {
            where: {
                id: eventRegistrationId
            },
            relations: ['event', 'eventLink']
        });

        await app.EmailModule.sendEventWillStartSoonEmail(
            eventRegistration.event,
            eventRegistration,
            eventRegistration.eventLink,
        )

        reply.send({
            ok: true
        })
    });

    router.post('/send-to', {
        schema: {
            description: '',
            body: obj({
                templateName: str(1),
                email: str(1),
                subject: str(1),
            })
        }
    }, async (req, reply) => {
        const userId = Number(app.AuthService.getUserId(req.session));
        if (!app.AccessModule.isPlatformAdmin(await app.AccessModule.getUserById(userId))) {
            return reply.code(403).send({
                error: 'User is not administrator',
            });
        }

        const templateName = req.body.templateName;
        const email = req.body.email;
        const subject = req.body.subject;

        const data = {
            from: "RIFGO <noreply@rifgo.com>",
            to: email,
            subject: subject,
            template: templateName,
        };
        await app.Mailgun.messages().send(data, function (error, body) {
            console.log(body);
        });

        reply.send({
            ok: true
        });
    });

    router.get('/send-molchanov', async (req, reply) => {
        const userId = Number(app.AuthService.getUserId(req.session));
        if (!app.AccessModule.isPlatformAdmin(await app.AccessModule.getUserById(userId))) {
            return reply.code(403).send({
                error: 'User is not administrator',
            });
        }

        const eventId = req.query.eventId;
        const email = req.query.email;
        if (!eventId && !email) { return reply.code(400).send({error: 'eventId is required'}) }

        let emails;
        if (!email) {
            const eventRegistrations = await app.dbm.find(EventRegistration, {
                event: {id: eventId}
            });
            console.log(eventRegistrations)

            emails = new Set(eventRegistrations.map((reg) => reg.email));
        } else {
            emails = new Set([email]);
        }

        const DOMAIN = "rifgo.com";
        const mg = mailgun({apiKey: app.env.mailGunApiKey, domain: DOMAIN});

        for (const email of emails) {
            const data = {
                from: "RIFGO <noreply@rifgo.com>",
                to: email,
                subject: "Stream recording: Train Your Mental Toughness With the World Champion Freediver",
                template: "molchanov_video_link",
                // 'h:X-Mailgun-Variables': {test: "test"}
            };
            await mg.messages().send(data, function (error, body) {
                console.log(body);
            });

            console.log(`sent to: ${email}`)
        }

        reply.send({
            data: {
            }
        });
    });

    next()
}
