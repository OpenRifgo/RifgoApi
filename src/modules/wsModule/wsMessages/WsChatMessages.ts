import {ChatMessage} from '../../../entity/ChatMessage'
import {EntityManager} from 'typeorm/entity-manager/EntityManager'
import {User} from '../../../entity/User'
import {WsModule} from '../WsModule'
import {eventByFactory} from '../lib/eventBy'

interface IChatMessageRequestData {
    secret: string
    eventId?: string
    screenName: string
    messageText: string
}

export class WsChatMessages {
    protected wsApp: {dbm: EntityManager, wsModule: WsModule}

    constructor(wsApp: {dbm: EntityManager, wsModule: WsModule}) {
        this.wsApp = wsApp;
    }

    serializeChatMessage(
        params: {
            userId: number,
            eventId: number,
        },
        chatMessage: ChatMessage,
    ) {
        return {
            module: 'chat',
            event: 'message',
            data: {
                id: chatMessage.id,
                eventId: params.eventId,
                screenName: chatMessage.screenName,
                messageText: chatMessage.messageText,
                userId: params.userId,
            }
        }
    }

    serializeDonationMessage(
        params: {
            eventId: number,
            donationAmount: number,
            messageText: string
        },
        chatMessage: ChatMessage,
    ) {
        return {
            module: 'chat',
            event: 'donation',
            data: {
                eventId: params.eventId,
                screenName: chatMessage.screenName,
                donationAmount: params.donationAmount,
                messageText: params.messageText
            }
        }
    }

    async onChatMessage(params: {userId: number, socketSessionId: string}, data: {data: IChatMessageRequestData}) {
        try {
            const messageData = data.data;
            const userId = params.userId;

            const eventBy = eventByFactory(this.wsApp, {
                eventId: Number(messageData.eventId),
                userId: Number(userId),
                secret: messageData.secret,
            });

            const eventId = await eventBy.eventIdOrFail();
            const eventRegistration = eventBy.getEventRegistration ? await eventBy.getEventRegistration() : null;

            if (eventRegistration && eventRegistration.banned) {
                this.wsApp.wsModule.sendBySessionId(params.socketSessionId, {
                    module: 'chat',
                    event: 'error',
                    data: {
                        message: 'You are banned',
                    }
                });

                return;
            }

            // const eventRegistration = await c.dbm.findOneOrFail(EventRegistration, {
            //     where: {secret: messageData.secret},
            //     relations: ['event']
            // });
            //
            // const eventId = Number(eventRegistration.eventId);

            let chatMessageData: Partial<ChatMessage> = {};

            if (userId) {
                const user = await this.wsApp.dbm.findOne(User, {id: userId})
                chatMessageData = {user}
            }
            const chatMessage = this.wsApp.dbm.create(ChatMessage, {
                ...chatMessageData,
                screenName: messageData.screenName,
                messageText: messageData.messageText,
                socketSessionId: params.socketSessionId,
                event: {id: eventId},
                eventRegistration,
            })
            await this.wsApp.dbm.save(chatMessage);

            const broadcastMessage = this.serializeChatMessage({eventId, userId}, chatMessage);
            this.wsApp.wsModule.broadcastByTopic(`event:${eventId}`, broadcastMessage);
        } catch (e) {
            console.log(e);
        }
    }

    async broadcastDonatedMessage(params: {
        // socketSessionId: string,
        eventId: number,
        // secret: string,
        screenName: string,
        messageText: string,
        donationAmount: number,
    }) {
        try {
            const donationAmount = params.donationAmount;
            const messageText = params.messageText;

            const eventId = Number(params.eventId);

            let chatMessageData: Partial<ChatMessage> = {};

            const chatMessage = this.wsApp.dbm.create(ChatMessage, {
                ...chatMessageData,
                screenName: params.screenName,
                messageText: params.messageText,
                // socketSessionId: params.socketSessionId,
                event: {id: eventId},
                meta: {
                    donationAmount,
                }
            })

            const broadcastMessage = this.serializeDonationMessage({eventId, donationAmount, messageText}, chatMessage);
            this.wsApp.wsModule.broadcastByTopic(`event:${eventId}`, broadcastMessage);
        } catch (e) {
            console.log(e);
        }
    }
}
