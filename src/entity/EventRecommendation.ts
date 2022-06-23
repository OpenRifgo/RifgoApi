import {
    Column,
    CreateDateColumn,
    Entity,
    Index, ManyToOne,
    PrimaryGeneratedColumn, RelationId,
    UpdateDateColumn,
} from 'typeorm/index'
import {Event} from './Event'
import {EventLink} from './EventLink'

export enum EventRecommendationTypes {
    Recommended = 'Recommended',
    MyEvents = 'MyEvents',
}

/**
 * Recommendations for "next events"
 */
@Entity()
export class EventRecommendation {

    @PrimaryGeneratedColumn()
    id: number

    @ManyToOne(type => Event)
    event: Event
    @RelationId((self: EventRecommendation) => self.event)
    eventId: number

    @ManyToOne(type => Event)
    recommendedEvent: Event
    @RelationId((self: EventRecommendation) => self.recommendedEvent)
    recommendedEventId: number

    @ManyToOne(type => EventLink)
    recommendedEventLink: EventLink
    @RelationId((self: EventRecommendation) => self.recommendedEventLink)
    recommendedEventLinkId: number

    @Column({type: String, default: 'Recommended'})
    eventRecommendationType: EventRecommendationTypes

    // DB insert time
    @CreateDateColumn()
    public createdAt: Date

    // DB last update time
    @UpdateDateColumn()
    public updatedAt: Date

}
