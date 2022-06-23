import App from '../App'
import {EventLink} from '../entity/EventLink'
import {nanoid} from 'nanoid'
import assert from 'assert'
import {EventRegistration} from '../entity/EventRegistration'
import {Event} from "../entity/Event";

export class EventRegistrationService {
    protected app: App

    constructor(app: App) {
        this.app = app
    }

    async register(eventLinkUid: string, email: string) {
        assert(email, 'email is required');
        assert(eventLinkUid, 'eventLinkUid is required');

        const eventLink = await this.app.dbm.findOneOrFail(EventLink, {
            where: {
                uid: eventLinkUid
            },
            relations: ['event']
        });

        const event = eventLink.event;
        assert(event, 'eventLink must have event relation');

        const secret = nanoid(32);
        const eventRegistration = this.app.dbm.create(EventRegistration, {
            email, eventLink, event, secret,
        });
        await this.app.dbm.save(eventRegistration);

        if (event.accessType === 'paid') {
            await this.app.EmailModule.sendPaidEventRegistrationEmail(event, eventRegistration);
        } else {
            await this.app.EmailModule.sendFreeEventRegistrationEmail(event, eventRegistration);
        }
    }

    async confirmEventRegistrationBySecret(secret: string): Promise<EventRegistration> {
        const eventRegistration = await this.app.dbm.findOneOrFail(EventRegistration, {
            where: {
                secret
            },
            relations: ['event', 'event.user']
        });

        eventRegistration.confirmed = true;
        await this.app.dbm.save(eventRegistration);

        return eventRegistration;
    }
}
