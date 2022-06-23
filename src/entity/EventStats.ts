import {Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn} from 'typeorm'

@Entity()
export class EventStats {

    @PrimaryGeneratedColumn()
    id: number

    @Column({type: String, default: null, nullable: true})
    socketSessionId: string

    @Column({type: Number, default: null, nullable: true})
    connections: number

    @Column({type: 'bigint', nullable: true})
    timestamp: number

    // DB insert time
    @CreateDateColumn()
    public createdAt: Date
}
