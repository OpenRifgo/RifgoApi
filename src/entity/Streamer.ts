import {
    Column,
    CreateDateColumn,
    Entity,
    Index, JoinColumn, ManyToOne,
    PrimaryGeneratedColumn, RelationId,
    UpdateDateColumn,
} from 'typeorm/index'
import {User} from './User'

@Entity()
export class Streamer {
    @PrimaryGeneratedColumn()
    id: number

    @Column({type: String, default: ''})
    @Index()
    slug: string

    @Column({type: String, default: ''})
    @Index()
    name: string

    @Column({type: String, default: ''})
    @Index()
    title: string

    @Column({type: String, default: ''})
    @Index()
    avatarUrl: string

    @Column({
        type: 'jsonb',
        array: false,
        default: () => "'{}'",
        nullable: false,
    })
    smm: {insta: string, fb: string}

    @Column({
        type: 'jsonb',
        array: false,
        default: () => "'[]'",
        nullable: false,
    })
    buttons: Array<{label: string, url: string}>

    @Column({type: String, default: ''})
    @Index()
    achievements: string

    @Column({ type: "int", nullable: true })
    userId: number;

    // member of organization
    @ManyToOne(type => User, {nullable: true})
    @JoinColumn({ name: "userId" })
    user: User;

    // DB insert time
    @CreateDateColumn()
    public createdAt: Date

    // DB last update time
    @UpdateDateColumn()
    public updatedAt: Date
}
