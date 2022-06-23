import {
  Column,
  CreateDateColumn,
  Entity, Index,
  JoinColumn, ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm/index';
import {Consultant} from './Consultant'
import {ConsultantOffer} from './ConsultantOffer'


@Entity()
export class ConsultantBooking {

  @PrimaryGeneratedColumn()
  id: number;

  @Column({type: String})
  @Index({unique: true})
  uid: string;

  @Column({type: String})
  @Index()
  email: string;

  @Column({type: Number})
  price: number;

  @Column({type: Boolean, default: false})
  paid: boolean;

  @Column({ type: "int" })
  consultantId: number;
  // member of organization
  @ManyToOne(type => Consultant)
  @JoinColumn({ name: "consultantId" })
  consultant: Consultant;

  @Column({ type: "int" })
  offerId: number;
  // member of organization
  @ManyToOne(type => ConsultantOffer)
  @JoinColumn({ name: "offerId" })
  offer: ConsultantOffer;

  @Column({type: String, nullable: true})
  calendarLink: string;

  @Column({type: String, nullable: true})
  @Index({})
  referralUid: string;

  // DB insert time
  @CreateDateColumn()
  public createdAt: Date

  // DB last update time
  @UpdateDateColumn()
  public updatedAt: Date

}
