import {EventRegistration} from '../../../entity/EventRegistration'
import {Event} from '../../../entity/Event'
import {WsApp} from '../WsApp'
import {IAppDbm} from '../../../interfaces/appInterfaces'

/**
 * eventId finder
 */
export interface IEventIdOrFailer {
    eventIdOrFail(): Promise<number>
    getEventRegistration?(): Promise<EventRegistration>
}

export class EventBySecret implements IEventIdOrFailer {
    protected wsApp: IAppDbm;
    protected secret: string;
    protected eventRegistration: EventRegistration;

    constructor(wsApp: IAppDbm, secret: string) {
        this.wsApp = wsApp;
        this.secret = secret;
    }

    async getEventRegistration() {
        if (!this.eventRegistration) {
            this.eventRegistration = await this.wsApp.dbm.findOneOrFail(EventRegistration, {
                where: {secret: this.secret},
                relations: ['event']
            });
        }

        return this.eventRegistration;
    }

    async eventIdOrFail() {
        const eventRegistration = await this.getEventRegistration();

        return Number(eventRegistration.eventId);
    }
}

export class EventByEventId implements IEventIdOrFailer {
    protected wsApp: IAppDbm;
    protected eventId: number;
    protected userId: number;

    constructor(wsApp: IAppDbm, opts: {eventId: number, userId: number}) {
        this.wsApp = wsApp;
        this.eventId = opts.eventId;
        this.userId = opts.userId;
    }

    async eventIdOrFail() {
        await this.wsApp.dbm.findOneOrFail(Event, {
            id: this.eventId,
            user: {id: this.userId},
        });

        return Number(this.eventId);
    }
}

export function eventByFactory(wsApp: IAppDbm, opts: {eventId?: number, userId?: number, secret?: string}): IEventIdOrFailer {
    if (opts.secret && opts.secret != 'undefined') {
        return new EventBySecret(wsApp, opts.secret);
    } else {
        return new EventByEventId(wsApp, {userId: opts.userId, eventId: opts.eventId});
    }
}
