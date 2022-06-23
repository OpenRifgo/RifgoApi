import App from './App'
import {Event} from './entity/Event'
import {Between} from 'typeorm'
import moment from 'moment'
import {EventRegistration} from './entity/EventRegistration'
import {EventStats} from './entity/EventStats'

const liveStatsDaemonInterval = 1_000;

export function liveStatsDaemon(app: App) {
    let lock = false;
    let prevTime = Date.now();

    setInterval(async () => {
        if (!lock) {
            try {
                const timestamp = Date.now();

                const topicSessionConnections = app.wsModule.getEachTopicSessionsCount();

                for (let socketSessionId in topicSessionConnections) {
                    let connections = topicSessionConnections[socketSessionId];

                    if (connections > 0) {
                        const eventStats = app.dbm.create(EventStats, {
                            socketSessionId,
                            connections,
                            timestamp,
                        })
                        await app.dbm.save(eventStats);
                    }
                }
            } catch (e) {
                console.log(e)
            } finally {
                lock = false
            }
        }
    }, liveStatsDaemonInterval)
}
