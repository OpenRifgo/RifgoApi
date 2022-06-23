import {Event} from '../../entity/Event'
import {EventRegistration} from '../../entity/EventRegistration'
import {AbstractEachEventRegistration} from '../AbstractEachEventRegistration'

export class EventRegistrationWillStartSoonDaemon extends AbstractEachEventRegistration {
    async processEventRegistration(event: Event, eventRegistration: EventRegistration): Promise<void> {
        if (eventRegistration.paid) {
            await this.app.EmailModule.sendEventWillStartSoonEmail(
                event,
                eventRegistration,
                eventRegistration.eventLink,
            )
            console.log(`sendEventWillStartSoonEmail is sent to ${eventRegistration.email}`)
        } else {
            await this.app.EmailModule.sendEventWillStartSoonNotPaidEmail(
                event,
                eventRegistration,
                eventRegistration.eventLink,
            )
            console.log(`sendEventWillStartSoonNotPaidEmail is sent to ${eventRegistration.email}`)
        }
    }
}
