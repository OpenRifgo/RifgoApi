import {
    Column,
    CreateDateColumn,
    Entity, Index,
    ManyToOne,
    PrimaryGeneratedColumn, RelationId,
    UpdateDateColumn,
} from 'typeorm/index';

import {Event} from './Event';

@Entity()
export class EventBroadcast {

    @PrimaryGeneratedColumn()
    id: number

    @ManyToOne(type => Event)
    event: Event

    // read-only foreign keys
    @RelationId((self: EventBroadcast) => self.event)
    eventId: number

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

    @Column({type: Date, nullable: true})
    @Index()
    startedAt: Date

    @Column({type: Date, nullable: true})
    @Index()
    finishedAt: Date

    // DB insert time
    @CreateDateColumn()
    public createdAt: Date

    // DB last update time
    @UpdateDateColumn()
    public updatedAt: Date

}
