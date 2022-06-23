import {Event} from '../../entity/Event'
import {EventRegistration} from '../../entity/EventRegistration'
import {AbstractEachEventRegistration} from '../AbstractEachEventRegistration'
import {Streamer} from '../../entity/Streamer'

export class EventRegistrationWillStartInOneHourDaemon extends AbstractEachEventRegistration {
    async processEventRegistration(event: Event, eventRegistration: EventRegistration, streamer?: Streamer): Promise<void> {
        await this.app.EmailModule.sendEventWillStartInOneHour(
            event,
            eventRegistration,
            eventRegistration.eventLink,
            streamer,
        );
        console.log(`sendEventWillStartInOneHour is sent to ${eventRegistration.email}`)
    }
}
