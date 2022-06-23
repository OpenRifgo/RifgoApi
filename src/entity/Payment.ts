import {
    Column,
    CreateDateColumn,
    Entity,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm/index'
import {Index, ManyToOne, RelationId} from 'typeorm'
import {EventRegistration} from './EventRegistration'
import {Event} from './Event'
import {Streamer} from './Streamer'
import {nullable} from 'json-schema-blocks'

export enum PaymentProviders {
    StripeConnect = 'StripeConnect'
}

export enum PaymentStatus {
    New = 'New',
    Created = 'Created',
    Paid = 'Paid',
}

export enum PaymentFor {
  Event = 'Event',
  Donation = 'Donation',
  ConsultantOffer= 'ConsultantOffer',
}

@Entity()
export class Payment {

    @PrimaryGeneratedColumn()
    id: number

    @Column({type: String, length: 16})
    status: PaymentStatus

    @Column({type: String, length: 16, default: ''})
    paymentFor: PaymentFor

    @Column({type: String, length: 16})
    paymentProvider: PaymentProviders

    @Column({type: String, nullable: true})
    @Index()
    paymentProviderId: string

    @Column({type: String, nullable: true})
    @Index()
    paymentForId: string

    @Column("decimal", { precision: 19, scale: 2 })
    amount: number

    @Column("decimal", { precision: 19, scale: 2 })
    feeAmount: number

    @Column({type: String, length: 3})
    currency: string

    @Column({type: String, default: ''})
    @Index()
    screenName: string

    @Column({type: String, default: ''})
    @Index()
    donationQuestion: string

    @Column({type: Boolean, default: false})
    isPrivate: boolean; //don't show value in the chat

    @Column({
        type: 'jsonb',
        array: false,
        default: () => "'{}'",
        nullable: false,
    })
    paymentProviderResponse: object

    @ManyToOne(type => EventRegistration, {nullable: true})
    eventRegistration: EventRegistration
    @RelationId((self: Payment) => self.eventRegistration)
    eventRegistrationId: number

    @ManyToOne(type => Streamer, {nullable: true})
    streamer: Streamer
    @RelationId((self: Payment) => self.streamer)
    streamerId: number

    // DB insert time
    @CreateDateColumn()
    public createdAt: Date

    // DB last update time
    @UpdateDateColumn()
    public updatedAt: Date

}
