import {
    Column,
    CreateDateColumn,
    Entity,
    Index, OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm/index'
import {EventRegistration} from './EventRegistration'
import {Event} from './Event'

export enum UserStatuses {
    New = 'New',
    Active = 'Active',
    Streamer = 'Streamer',
    PlatformAdmin = 'PlatformAdmin'
}

@Entity()
export class User {

    @PrimaryGeneratedColumn()
    id: number

    @Column({type: String, default: ''})
    @Index({unique: true})
    email: string

    @Column({type: String, default: ''})
    password: string

    @Column({type: String, default: ''})
    name: string

    @Column({type: String, default: null})
    confirmSecret: string

    @Column({type: String, default: null})
    stripeAccountId: string

    @Column({type: String, default: null})
    calendlyAccessToken: string

    @Column({type: String, default: null})
    calendlyRefreshToken: string

    @Column({type: String, default: null})
    passwordChangeSecret: string

    @Column({type: String, default: 'New'})
    status: UserStatuses

    @Column({type: Boolean, default: false})
    hasTermsAgree: boolean

    @OneToMany(() => Event, event => event.user)
    events: Event[];

    // DB insert time
    @CreateDateColumn()
    public createdAt: Date

    // DB last update time
    @UpdateDateColumn()
    public updatedAt: Date

}
