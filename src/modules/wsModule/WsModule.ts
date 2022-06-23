import App from '../../App'
import 'ws'

export interface WebSocket {
    send: (payload) => void
}

/**
 * This class represents interface for communication
 */
export class WsModule {
    protected app: App;
    protected sessionIds: Record<string, WebSocket>;
    protected topicSubscriptions: Record<string, Record<string, WebSocket>>;
    protected topicSubscriptionsBySessionId: Record<string, Record<string, WebSocket>>; // reversed index

    constructor(app: App) {
        this.app = app;

        this.sessionIds = {};
        this.topicSubscriptions = {};
        this.topicSubscriptionsBySessionId = {};
    }

    getTopicSessionsCount(subscriptionId: string) {
        return Object.keys(this.topicSubscriptions[subscriptionId]).length;
    }

    getEachTopicSessionsCount() {
        return Object.fromEntries(
            Object.keys(this.topicSubscriptions).map((subscriptionId) => {
                return [subscriptionId, this.getTopicSessionsCount(subscriptionId)];
            })
        );
    }

    // async subscribeToTopic(subscriptionId: string, socketSessionId: string) {
    async subscribeWebsocketToTopic(subscriptionId: string, socketSessionId: string, ws: WebSocket) {
        // 1. check user can subscribe

        // 2. subscribe to

        if (!this.topicSubscriptions[subscriptionId]) {
            this.topicSubscriptions[subscriptionId] = {};
        }
        this.topicSubscriptions[subscriptionId][socketSessionId] = ws;

        if (!this.topicSubscriptionsBySessionId[socketSessionId]) {
            this.topicSubscriptionsBySessionId[socketSessionId] = {};
        }
        this.topicSubscriptionsBySessionId[socketSessionId][subscriptionId] = ws;
    }

    broadcastByTopic(subscriptionId: string, data) {
        const subs = this.topicSubscriptions[subscriptionId];
        const strData = JSON.stringify(data);

        for (let socketSessionId in subs) {
            try {
                const socket = subs[socketSessionId];
                socket.send(strData);
            } catch (e) {
                this.app.logger.error(e);
            }
        }
    }

    sendBySessionId(socketSessionId: string, data) {
        const strData = JSON.stringify(data);

        const socket = this.sessionIds[socketSessionId];
        socket.send(strData);
    }

    async registerSessionId(socketSessionId: string, conn) {
        const currentSession = this.sessionIds[socketSessionId];
        if (currentSession) {
            try {
                // todo: close socket
            } catch (e) {
                this.app.logger.error(e.message, e.stack);
            }
        }

        this.sessionIds[socketSessionId] = conn;
        this.topicSubscriptionsBySessionId[socketSessionId] = {};
    }

    getTopicSubscriptionsBySessionId(socketSessionId: string) {
        return Object.keys(this.topicSubscriptionsBySessionId[socketSessionId]);
    }

    async unregisterSessionId(socketSessionId: string) {
        // remove sessionId
        delete this.sessionIds[socketSessionId];

        // remove by subscriptionId
        const subscriptionIds = this.getTopicSubscriptionsBySessionId(socketSessionId);
        subscriptionIds.forEach((subscriptionId) => {
            // no dangling sessions here for correct getTopicSessionsCount() computation
            delete this.topicSubscriptions[subscriptionId][socketSessionId];
        });
        delete this.topicSubscriptionsBySessionId[socketSessionId];

        return {
            removedFromSubscriptionIds: subscriptionIds
        }
    }
}
