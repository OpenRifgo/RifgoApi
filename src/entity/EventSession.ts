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
export class EventSession {

    @PrimaryGeneratedColumn()
    id: number

    @ManyToOne(type => Event)
    event: Event

    // read-only foreign keys
    @RelationId((self: EventSession) => self.event)
    eventId: number

    @Column({type: String, default: null, nullable: true})
    streamingSessionId: string

    @Column({type: String, default: null, nullable: true})
    streamingToken: string

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
