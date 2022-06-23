import App from '../App'
import {Event} from '../entity/Event'
import assert = require('assert')
import {ChatMessage} from '../entity/ChatMessage'
import {id, obj, str} from 'json-schema-blocks'
import {chatEvents} from '../pubsub/chatEvents'

const app = App.getInstance()

export default function (router, opts, next) {

    router.get('/messages', async (req, resp) => {
        // const userId = app.AuthService.getUserId(req.session)
        // if (!userId) {
        //     return resp.code(403).send({
        //         error: 'User not authenticated'
        //     })
        // }

        const eventId = req.query.eventId
        assert(eventId, 'eventId is required')

        // const data = req.body as {
        //     messageText: string
        //     screenName: string
        //     eventId: number
        //     userId: number
        //     isCurrentUser: boolean
        // }

        const event = await app.dbm.findOneOrFail(Event, {
            id: eventId
        })

        const chatMessages = await app.dbm.find(ChatMessage, {
            where: {
                event: {id: event.id},
                removed: false,
            },
            order: {id: 1}
        });

        resp.send({
            chatMessages: chatMessages.map((message) => ({
                ...message,
            })),
        })
    });

    router.get('/:registrationSecret/me', {
        schema: {
            params: obj({
                registrationSecret: str(1),
            })
        }
    }, async (req, resp) => {
        //todo: check it when moderators will be configurable per stream/streamer
        const registrationSecret = req.query.registrationSecret;

        const userId = Number(app.AuthService.getUserId(req.session));
        //only platform admins are allowed at the moment to be moderators
        const isPlatformAdmin = app.AccessModule.isPlatformAdmin(await app.AccessModule.getUserById(userId));

        resp.send({
            me: {
                isModerator: isPlatformAdmin,
            }
        });
    });

    next()
}
