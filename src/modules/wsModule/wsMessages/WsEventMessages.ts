export class WsEventMessages {
    serializeBroadcastStatusChangedMessage(
        eventType: 'broadcast:started' | 'broadcast:finished',
        broadcastData: { eventId: number, screenName: string, messageText: string },
    ) {
        const eventId = Number(broadcastData.eventId);

        return {
            module: 'event',
            event: eventType,
            data: {
                eventId,
            }
        }
    }
}
