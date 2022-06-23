export class WsSubMessages {
    serializeViewersCountChangedMessage(
        params: {
            eventId: number,
            viewersCount: number,
        }
    ) {
        return {
            module: 'sub',
            event: 'broadcast:viewers-count-changed',
            data: params
        }
    }
}
