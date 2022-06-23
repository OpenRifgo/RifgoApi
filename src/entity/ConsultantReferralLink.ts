import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import {Index} from 'typeorm/index';
import {Consultant} from './Consultant';

@Entity()
export class ConsultantReferralLink {

  @PrimaryGeneratedColumn()
  id: number;

  @Column({type: String})
  @Index({unique: true})
  uid: string;

  @Column({type: String})
  @Index()
  email: string;

  @Column({ type: "int" })
  consultantId: number;
  // member of organization
  @ManyToOne(type => Consultant)
  @JoinColumn({ name: "consultantId" })
  consultant: Consultant;

  @Column({type: 'int', default: 0})
  registrations;

  @Column({type: 'int', default: 0})
  confirmations;

  // DB insert time
  @CreateDateColumn()
  public createdAt: Date;

  // DB last update time
  @UpdateDateColumn()
  public updatedAt: Date;

}
