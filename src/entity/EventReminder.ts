import {
    Column,
    CreateDateColumn,
    Entity,
    Index, ManyToOne,
    PrimaryGeneratedColumn, RelationId,
    UpdateDateColumn,
} from 'typeorm/index'
import {Event} from './Event'
import {EventRegistration} from './EventRegistration'

/**
 * List of sent reminders sent to users
 */
@Entity()
export class EventReminder {

    @PrimaryGeneratedColumn()
    id: number

    @Column({type: String, default: ''})
    @Index()
    email: string

    @ManyToOne(type => Event)
    event: Event
    @RelationId((self: EventReminder) => self.event)
    eventId: number

    @ManyToOne(type => EventRegistration)
    eventRegistration: EventRegistration
    @RelationId((self: EventReminder) => self.eventRegistration)
    eventRegistrationId: number

    // DB insert time
    @CreateDateColumn()
    public createdAt: Date

    // DB last update time
    @UpdateDateColumn()
    public updatedAt: Date

}
