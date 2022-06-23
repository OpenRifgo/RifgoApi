import {Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn} from 'typeorm'
import {PaymentProviders} from './Payment'
import {Index} from 'typeorm'

@Entity()
export class PaymentSystemLog {

    @PrimaryGeneratedColumn()
    id: number

    @Column({type: String, length: 16})
    paymentProvider: PaymentProviders

    @Column({type: String, nullable: true})
    @Index()
    paymentProviderId: string

    @Column({type: String, default: ''})
    @Index()
    event: string

    @Column({
        type: 'jsonb',
        array: false,
        default: () => "'{}'",
        nullable: false,
    })
    data: object

    // DB insert time
    @CreateDateColumn()
    public createdAt: Date

    // DB last update time
    @UpdateDateColumn()
    public updatedAt: Date

}
