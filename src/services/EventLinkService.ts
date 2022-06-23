import App from '../App'
import {EventLink} from '../entity/EventLink'
import {nanoid} from 'nanoid'

export class EventLinkService {
    protected app: App

    constructor(app: App) {
        this.app = app
    }

    async createEventLink(eventId: number) {
        const eventLink = this.app.dbm.create(EventLink, {
            uid: nanoid(),
            event: {id: eventId}
        })

        await this.app.dbm.save(eventLink)

        return eventLink
    }

    async getEventLinks(eventId: number) {
        return this.app.dbm.find(EventLink, {event: {id: eventId}})
    }
}
