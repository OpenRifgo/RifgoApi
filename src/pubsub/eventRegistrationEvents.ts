import mitt, { Emitter } from 'mitt';
import {EventRegistration} from '../entity/EventRegistration'
import App from '../App'
import {Event} from '../entity/Event'
import {EventLink} from '../entity/EventLink'

type EventRegistrationEvents = {
    paid?: {
        event: Event,
        eventRegistration: EventRegistration,
    }
};

export const eventRegistrationEvents: Emitter<EventRegistrationEvents> = mitt<EventRegistrationEvents>();

const app = App.getInstance();

// Send email with link when paid
eventRegistrationEvents.on('paid', async (data) => {
    const event = data.event,
          eventRegistration = data.eventRegistration;

    const eventLink = await app.dbm.findOne(EventLink, {
        id: eventRegistration.eventLinkId
    });

    await app.EmailModule.sendEventPersonalLinkEmail(
        event,
        eventRegistration,
        eventLink,
    );
});
