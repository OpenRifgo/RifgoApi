import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    ManyToOne,
    PrimaryGeneratedColumn,
    RelationId,
    UpdateDateColumn,
} from 'typeorm'

import {Event} from './Event'

@Entity()
export class EventLink {

    @PrimaryGeneratedColumn()
    id: number

    @Column({type: String})
    @Index({unique: true})
    uid: string

    @ManyToOne(type => Event)
    event: Event

    // read-only foreign keys
    @RelationId((self: EventLink) => self.event)
    eventId: number

    // DB insert time
    @CreateDateColumn()
    public createdAt: Date

    // DB last update time
    @UpdateDateColumn()
    public updatedAt: Date

}
