import App from '../../App'
import {Streamer} from "../../entity/Streamer";
import {arr, id, num, obj, str} from 'json-schema-blocks'
import {publicEventLinkSchema} from '../../common/schema/commonEventSchema'
import {PaymentProviders, PaymentStatus} from '../../entity/Payment'
import {ChatMessage} from '../../entity/ChatMessage'
import {User} from '../../entity/User'
import {chatEvents} from '../../pubsub/chatEvents'

const app = App.getInstance()

export default function (router, opts, next) {

    router.post('/banUserByMessage', {
        schema: {
            body: obj({
                id: id(),
            })
        }
    }, async (req, resp) => {
        const userId = Number(app.AuthService.getUserId(req.session));
        if (!app.AccessModule.isPlatformAdmin(await app.AccessModule.getUserById(userId))) {
            return resp.code(403).send({
                error: 'User is not moderator',
            });
        }

        const body = req.body as {id: number};
        const messageId = body.id;

        const chatMessage = await app.dbm.findOneOrFail(ChatMessage, {
            where: {id: messageId},
            relations: ['eventRegistration']
        });

        if (chatMessage.eventRegistration) {
            chatMessage.eventRegistration.banned = true;

            await app.dbm.save(chatMessage.eventRegistration);

            resp.send({
                ok: true,
                chatMessage,
            })
        } else {
            resp.send({
                ok: false
            })
        }
    });

    router.post('/removeMessage', {
        schema: {
            body: obj({
                id: id(),
            })
        }
    }, async (req, resp) => {
        const userId = Number(app.AuthService.getUserId(req.session));
        if (!app.AccessModule.isPlatformAdmin(await app.AccessModule.getUserById(userId))) {
            return resp.code(403).send({
                error: 'User is not moderator',
            });
        }

        const body = req.body as {id: number};
        const messageId = body.id;

        const chatMessage = await app.dbm.findOneOrFail(ChatMessage, {
            where: {id: messageId}
        });
        chatMessage.removed = true;
        await app.dbm.save(chatMessage);

        chatEvents.emit('messageRemoved', {
            chatMessage
        })

        resp.send({
            ok: true,
        })
    });

    next()
}
