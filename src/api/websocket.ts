import {Session} from 'fastify-secure-session'
import {FastifyInstance} from 'fastify'
import App from '../App'
import {Socket} from 'net'
import {WebSocket} from '../modules/wsModule/WsModule'
import {WsSubMessages} from '../modules/wsModule/wsMessages/WsSubMessages'
import {eventByFactory} from '../modules/wsModule/lib/eventBy'
import {debounceFactory} from '../modules/wsModule/lib/debounceFactory'
import {WsApp} from '../modules/wsModule/WsApp'

const cookie = require('cookie');

const c = App.getInstance();

// export function websocketVerifyClient(fastify: FastifyInstance, info) {
//     const userId = getUserId(fastify, info.req.headers)
//
//     // allow if userId exists
//     return Boolean(userId)
// }

function getUserSessionData(fastify: FastifyInstance, headers) {
    const cookies = cookie.parse(headers.cookie || '')
    if (!cookies) return null

    const session = fastify.decodeSecureSession(cookies['session']) as Session
    if (!session || session.deleted) return null

    return {
        userId: session.get('userId'),
        registrationSecret: session.get('registrationSecret'),
    }
}

const debounceInstance = debounceFactory(1000);

export async function handleWebsocket(fastify: FastifyInstance, conn: {socket: Socket}, req) {
    const wsApp = WsApp.getInstance();

    const ws = conn.socket;
    const sessionData = getUserSessionData(fastify, req.headers);
    const userId = sessionData?.userId;
    const userKey = sessionData?.userId || sessionData?.registrationSecret;

    // get socketSessionId from HTTP query params
    const socketSessionId = req.query?.socketSessionId;
    if (!socketSessionId) return;

    await wsApp.wsModule.registerSessionId(socketSessionId, ws);

    ws.on('close', async (had_error: boolean) => {
        const {removedFromSubscriptionIds} = await c.wsModule.unregisterSessionId(socketSessionId);

        // const subscriptionId = `event:${eventRegistration.eventId}`;

        // broadcast viewers count
        removedFromSubscriptionIds.forEach(subscriptionId => {
            const eventId = Number(subscriptionId.split('event:')[1]);
            debounceInstance(
                () => {
                    const viewersCount = c.wsModule.getTopicSessionsCount(subscriptionId);
                    const broadcastMessage = new WsSubMessages().serializeViewersCountChangedMessage({eventId, viewersCount});
                    c.wsModule.broadcastByTopic(subscriptionId, broadcastMessage);
                }
            );
        });
    });

    ws.on('message', async message => {
        const data = JSON.parse(message) as {
            module: string
            event: string
            data: any
        }

        if (data.module === 'chat') {
            if (data.event === 'message') {
                await wsApp.wsChat.onChatMessage(
                    {userId, socketSessionId},
                    data
                );
            }
        } else if (data.module === 'event') {
            if (data.event === 'broadcast:started' || data.event === 'broadcast:finished') {
                const broadcastData = data.data;
                const broadcastMessage = wsApp.wsEvent.serializeBroadcastStatusChangedMessage(data.event, broadcastData);
                c.wsModule.broadcastByTopic(`event:${broadcastData.eventId}`, broadcastMessage);
            }
        } else if (data.module == 'sub') {
            if (data.event === 'subscribe:event') {
                try {
                    const subscribeData = data.data as {
                        secret?: string
                        eventId?: number
                    }

                    const eventBy = eventByFactory(wsApp, {
                        eventId: Number(subscribeData.eventId),
                        userId: Number(userId),
                        secret: subscribeData.secret,
                    });
                    const eventId = await eventBy.eventIdOrFail();

                    const subscriptionId = `event:${eventId}`;

                    const socket = conn.socket as unknown as WebSocket;
                    await c.wsModule.subscribeWebsocketToTopic(`event:${eventId}`, socketSessionId, socket);

                    // broadcast viewers count
                    debounceInstance(
                        () => {
                            const viewersCount = c.wsModule.getTopicSessionsCount(subscriptionId);
                            const broadcastMessage = wsApp.wsSub.serializeViewersCountChangedMessage({eventId, viewersCount});
                            c.wsModule.broadcastByTopic(subscriptionId, broadcastMessage);
                        }
                    );
                } catch (e) {
                    console.log(e);
                }
            }
            // // const subscriptionPrefix = Number(data.data.event);
            // const subscriptionId = Number(data.data.eventId);
        }

        // if (body.type == 'chat:message') {
        //     const val = body as IChatMessage
        //     return await this.onChatMessage(userId, val)
        // } else if (body.type == 'subscribe') {
        //     const val = body as {
        //         data: {
        //             entityName: string,
        //             entityId: string,
        //         }
        //     }
        //     if (val.data.entityName == 'session') {
        //         await this.app.WsEngine
        //             .subscribeUserTo(
        //                 userId,
        //                 `${val.data.entityName}_${val.data.entityId}`
        //             )
        //     } else {
        //         //todo: warning (when logger interface will be implemented)
        //     }
        //     return
        // }
    })
}
