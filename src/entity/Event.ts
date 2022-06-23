import {
    Column,
    CreateDateColumn,
    Entity,
    ManyToOne, OneToMany,
    PrimaryGeneratedColumn, RelationId,
    UpdateDateColumn,
} from 'typeorm/index'
import {User} from './User'
import {EventLink} from './EventLink'
import {EventRegistration} from './EventRegistration'
import {Index} from 'typeorm'
import {EventRecommendation} from './EventRecommendation'

@Entity()
export class Event {

    @PrimaryGeneratedColumn()
    id: number

    @Column({type: String})
    name: string

    @Column({type: String})
    description: string

    @Column({type: String, default: ''})
    speakerName: string

    @Column({type: String, default: ''})
    speakerTitle: string

    @Column({type: String, default: ''})
    speakerAvatarUrl: string

    @Column({type: String})
    date: string

    @Column({type: String})
    timeFrom: string

    @Column({type: String})
    timeTo: string

    @Column({type: Date, nullable: true})
    @Index()
    dateTimeFrom: Date

    @Column({type: Date, nullable: true})
    @Index()
    dateTimeTo: Date

    @Column({type: String})
    accessType: string

    @Column({type: String, nullable: true})
    timezone: string

    @Column({type: Number, nullable: true})
    amount: number

    @Column({type: Boolean, default: false})
    isFinallyStoped: boolean

    @Column({type: String, default: null, nullable: true})
    streamingSessionId: string

    @Column({type: String, default: null, nullable: true})
    streamingToken: string

    @Column({type: String, default: null, nullable: true})
    streamingBroadcastId: string

    @Column({type: String, default: null, nullable: true})
    streamingBroadcastLink: string

    @Column({type: String, default: null, nullable: true})
    streamingArchiveId: string

    // @Column({type: String, default: null, nullable: true})
    // promoText: string

    @ManyToOne(type => User)
    user: User

    // read-only foreign keys
    @RelationId((self: Event) => self.user)
    userId: number

    // for quick customization - long-term features shouldn't use it
    @Column({
        type: 'jsonb',
        array: false,
        default: () => "'{}'",
        nullable: false,
    })
    settings: object

    @OneToMany(() => EventLink, eventLink => eventLink.event)
    eventLinks: EventLink[];

    @OneToMany(() => EventRegistration, eventRegistration => eventRegistration.event)
    eventRegistrations: EventRegistration[];

    @OneToMany(() => EventRecommendation, eventRecommendation => eventRecommendation.event)
    recommendedEvents: EventRecommendation[];

    // DB insert time
    @CreateDateColumn()
    public createdAt: Date

    // DB last update time
    @UpdateDateColumn()
    public updatedAt: Date

}
