import App from './App'
import {EventRegistrationWillStartInOneDayDaemon} from './daemons/email/EventRegistrationWillStartInOneDayDaemon'
import {EventRegistrationStartsNowDaemon} from './daemons/email/EventRegistrationStartsNowDaemon'
import {EventRegistrationWillStartInOneHourDaemon} from './daemons/email/EventRegistrationWillStartInOneHourDaemon'
import {EventRegistrationWillStartInTenMinutesDaemon} from './daemons/email/EventRegistrationWillStartInTenMinutesDaemon'

export function emailDaemon(app: App) {
    // new EventRegistrationWillStartSoonDaemon(app, {
    //     shiftAmount: 10,
    //     shiftUnit: 'minutes',
    // }).run();

    new EventRegistrationWillStartInOneDayDaemon(app, {
        shiftAmount: 1,
        shiftUnit: 'day',
        interval: 61_000,
    }).run();

    new EventRegistrationWillStartInOneHourDaemon(app, {
        shiftAmount: 1,
        shiftUnit: 'hour',
        interval: 23_000,
    }).run();

    new EventRegistrationWillStartInTenMinutesDaemon(app, {
        shiftAmount: 10,
        shiftUnit: 'minutes',
        interval: 3_117,
    }).run();

    new EventRegistrationStartsNowDaemon(app, {
        shiftAmount: 0,
        shiftUnit: 'minutes',
        interval: 7_000,
    }).run();
}
