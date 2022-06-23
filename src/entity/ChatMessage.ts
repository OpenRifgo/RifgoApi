import {
    Column,
    CreateDateColumn,
    Entity,
    Index, JoinColumn, ManyToOne,
    PrimaryGeneratedColumn, RelationId,
    UpdateDateColumn,
} from 'typeorm/index'
import {User} from './User'
import {Event} from './Event'
import {EventRegistration} from './EventRegistration'

@Entity()
@Index(['removed', 'eventId'])
export class ChatMessage {

    @PrimaryGeneratedColumn()
    id: number

    @Column({type: String, default: 'message'})
    messageType: 'message' | 'donation'

    @Column({type: String})
    screenName: string

    @Column({type: String})
    messageText: string

    @Column({type: String, default: ''})
    @Index()
    socketSessionId: string

    @Column({
        type: 'jsonb',
        array: false,
        default: () => "'{}'",
        nullable: false,
    })
    meta: { donationAmount?: number }

    @Column({ type: "int", nullable: true })
    eventId: number;

    // member of organization
    @ManyToOne(type => ChatMessage, {nullable: true})
    @JoinColumn({ name: "eventId" })
    event: Event;

    @ManyToOne(type => User, {nullable: true})
    user: User

    // read-only foreign keys
    @RelationId((self: ChatMessage) => self.user)
    userId: number

    @ManyToOne(type => EventRegistration, {nullable: true})
    eventRegistration: EventRegistration

    // read-only foreign keys
    @RelationId((self: ChatMessage) => self.eventRegistration)
    eventRegistrationId: number

    @Column({type: Boolean, default: false})
    removed: boolean

    // DB insert time
    @CreateDateColumn()
    public createdAt: Date

    // DB last update time
    @UpdateDateColumn()
    public updatedAt: Date

}
