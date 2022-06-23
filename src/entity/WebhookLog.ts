import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm/index'

@Entity()
export class WebhookLog {
    @PrimaryGeneratedColumn()
    id: number

    @Column({type: String, default: ''})
    @Index()
    provider: string

    @Column({
        type: 'jsonb',
        array: false,
        default: () => "'{}'",
        nullable: false,
    })
    body: object

    @Column({
        type: 'jsonb',
        array: false,
        default: () => "'{}'",
        nullable: false,
    })
    query: object

    @Column({
        type: 'jsonb',
        array: false,
        default: () => "'{}'",
        nullable: false,
    })
    result: object

    // DB insert time
    @CreateDateColumn()
    public createdAt: Date

    // DB last update time
    @UpdateDateColumn()
    public updatedAt: Date
}
