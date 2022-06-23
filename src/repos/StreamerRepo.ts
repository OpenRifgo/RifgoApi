import App from '../App'
import {User} from '../entity/User'
import {Event} from '../entity/Event'
import {Between} from 'typeorm'
import moment from 'moment'
import {Streamer} from '../entity/Streamer'

export default class StreamerRepo {
    protected app: App

    constructor(app: App) {
        this.app = app
    }

    async findStreamerByEvent(event: Event) {
        const userId = event.userId;

        return await this.app.dbm.findOne(Streamer, {
            where: {userId},
            order: {id: 'DESC'}
        });
    }
}
