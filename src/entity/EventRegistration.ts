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

/**
 * Represents exact user registered on event
 */
@Entity()
export class EventRegistration {

    @PrimaryGeneratedColumn()
    id: number

    @Column({type: String, default: ''})
    @Index()
    email: string

    @Column({type: String, default: ''})
    @Index()
    screenName: string

    @Column({type: String})
    @Index()
    secret: string

    @ManyToOne(type => Event)
    event: Event
    @RelationId((self: EventRegistration) => self.event)
    eventId: number

    @ManyToOne(type => EventLink)
    eventLink: EventLink
    @RelationId((self: EventRegistration) => self.eventLink)
    eventLinkId: number

    @Column({type: Boolean, default: false})
    confirmed: boolean

    @Column({type: Boolean, default: false})
    paid: boolean

    @Column({type: Boolean, default: false})
    banned: boolean

    // DB insert time
    @CreateDateColumn()
    public createdAt: Date

    // DB last update time
    @UpdateDateColumn()
    public updatedAt: Date

}
