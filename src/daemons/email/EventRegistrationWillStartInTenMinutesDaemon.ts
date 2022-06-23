import {Event} from '../../entity/Event'
import {EventRegistration} from '../../entity/EventRegistration'
import {AbstractEachEventRegistration} from '../AbstractEachEventRegistration'
import {Streamer} from '../../entity/Streamer'

export class EventRegistrationWillStartInTenMinutesDaemon extends AbstractEachEventRegistration {
    async processEventRegistration(event: Event, eventRegistration: EventRegistration, streamer?: Streamer): Promise<void> {
        await this.app.EmailModule.sendEventWillStartInTenMinutes(
            event,
            eventRegistration,
            eventRegistration.eventLink,
            streamer,
        );
        console.log(`sendEventWillStartInTenMinutes is sent to ${eventRegistration.email}`)
    }
}
