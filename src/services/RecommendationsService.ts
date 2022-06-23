import App from '../App'
import {EventRecommendation, EventRecommendationTypes} from '../entity/EventRecommendation'
import {Event} from '../entity/Event'
import {Streamer} from '../entity/Streamer'
import {Not} from 'typeorm';

const serializeRec = (rec) => ({
    ...rec.recommendedEvent,
    publicEventLink: {
        uid: rec.recommendedEventLink.uid,
    }
});

export default class RecommendationsService {
    protected app: App

    constructor(app: App) {
        this.app = app
    }

    filterSerializeList(eventRecommendations: EventRecommendation[], eventType: EventRecommendationTypes) {
        return eventRecommendations
            .filter((rec) => rec.eventRecommendationType == eventType)
            .map(serializeRec);
    }

    /**
     * Find recommendation by event
     *
     * @param event
     */
    async getRecommendationsByEvent(event: Event) {
        return await this.app.dbm.find(EventRecommendation, {
            where: {
                event,
                recommendedEvent: Not(event.id)
            },
            relations: ['recommendedEvent', 'recommendedEventLink']
        });
    }

    /**
     * Find recommendation by streamer's slug (for next events)
     *
     * @param slug
     */
    async getRecommendationsByStreamerSlug(slug: string) {
        const streamer = await this.app.dbm.findOneOrFail(Streamer, {
            where: {
                slug,
            },
            relations: ['user']
        });
        const streamerUser = streamer.user;

        const events = await this.app.dbm.find(Event, {
            where: {
                user: streamerUser,
            },
            relations: ['recommendedEvents', 'recommendedEvents.recommendedEventLink', 'recommendedEvents.recommendedEvent']
        });

        const recommendedEvents = events
            .flatMap((event) => event.recommendedEvents)

        return recommendedEvents;
    }

    /**
     * Find and serialize recommendations by event
     *
     * @param event
     */
    async getSerializedRecommendationsByEvent(event: Event) {
        const eventRecommendations = await this.getRecommendationsByEvent(event);
        const myEvents = this.filterSerializeList(eventRecommendations, EventRecommendationTypes.MyEvents);
        const recommendedEvents = this.filterSerializeList(eventRecommendations, EventRecommendationTypes.Recommended);
        return {
            myEvents,
            recommendedEvents,
        }
    }

    /**
     * Find & serialize recommendations by streamer's slug (for next events)
     *
     * @param streamerSlug
     */
    async getSerializedRecommendationsByStreamerSlug(streamerSlug: string) {
        const eventRecommendations = await this.getRecommendationsByStreamerSlug(streamerSlug);

        const myEvents = this.filterSerializeList(eventRecommendations, EventRecommendationTypes.MyEvents);
        const recommendedEvents = this.filterSerializeList(eventRecommendations, EventRecommendationTypes.Recommended);

        return {
            myEvents,
            recommendedEvents,
        }
    }
}
