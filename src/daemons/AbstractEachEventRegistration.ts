import App from '../App'
import moment, {unitOfTime} from 'moment'
import {Event} from '../entity/Event'
import {EventRegistration} from '../entity/EventRegistration'
import {Between} from 'typeorm'
import {Streamer} from '../entity/Streamer'

export abstract class AbstractEachEventRegistration {
    protected app: App;
    protected lock: boolean;
    protected interval: number;
    protected shiftAmount: number;
    protected shiftUnit: unitOfTime.DurationConstructor;

    constructor(app: App, opts?: {
        interval?: number,
        shiftAmount?: number,
        shiftUnit?: unitOfTime.DurationConstructor
    }) {
        this.app = app;
        this.lock = false;
        this.interval = opts.interval || 1_000;
        this.shiftAmount = opts.shiftAmount || 0;
        this.shiftUnit = opts.shiftUnit || 'minutes';
    }

    abstract processEventRegistration(event: Event, eventRegistration: EventRegistration, streamer?: Streamer): Promise<void>

    run() {
        let prevTime = Date.now();
        setInterval(async () => {
            if (!this.lock) {
                try {
                    this.lock = true;
                    const newTime = Date.now();

                    const events = await this.app.dbm.find(Event, {
                        dateTimeFrom: Between(
                            moment(prevTime).add(this.shiftAmount, this.shiftUnit).toDate(),
                            moment(newTime).add(this.shiftAmount, this.shiftUnit).toDate(),
                        ),
                    });

                    for (let event of events) {
                        const streamer = await this.app.repos.StreamerRepo.findStreamerByEvent(event);

                        console.log(event);

                        const eventRegistrations = await this.app.dbm.find(EventRegistration, {
                            where: {
                                event: {id: event.id},
                            },
                            relations: ['eventLink'],
                        });

                        for (let eventRegistration of eventRegistrations) {
                            // call processing for concrete implementation
                            await this.processEventRegistration(event, eventRegistration, streamer);
                        }

                        console.log(eventRegistrations);
                    }

                    prevTime = newTime;
                } catch (e) {
                    console.log(e)
                } finally {
                    this.lock = false
                }
            }
        }, this.interval)
    }
}
