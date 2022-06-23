import {Connection} from 'typeorm/connection/Connection'
import {WsModule} from './WsModule'
import {WsChatMessages} from './wsMessages/WsChatMessages'
import {WsEventMessages} from './wsMessages/WsEventMessages'
import {WsSubMessages} from './wsMessages/WsSubMessages'
import {IAppDbm} from '../../interfaces/appInterfaces'
import App from '../../App'


export class WsApp implements IAppDbm {
    // singleton
    private static instance: WsApp

    /**
     * Get instance
     */
    public static getInstance(): WsApp {
        if (!WsApp.instance) {
            WsApp.instance = new WsApp();

            // pass database from global scope
            WsApp.instance.db = App.getInstance().db;

            // pass wsModule from global scope
            WsApp.instance.wsModule = App.getInstance().wsModule;
        }

        return WsApp.instance
    }

    db: Connection
    wsModule: WsModule

    get dbm() {
        return this.db.manager
    }

    protected _WsChatMessages: WsChatMessages;
    get wsChat() {
        return this._WsChatMessages || (this._WsChatMessages = new WsChatMessages(this));
    }

    protected _WsEventMessages: WsEventMessages;
    get wsEvent() {
        return this._WsEventMessages || (this._WsEventMessages = new WsEventMessages());
    }

    protected _WsSubMessages: WsSubMessages;
    get wsSub() {
        return this._WsSubMessages || (this._WsSubMessages = new WsSubMessages());
    }
}
