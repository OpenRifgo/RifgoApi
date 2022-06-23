import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn, ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm/index';
import {Consultant} from './Consultant';


@Entity()
export class ConsultantOffer {

  @PrimaryGeneratedColumn()
  id: number;

  @Column({type: Number})
  price: number;

  @Column({type: String, default: ''})
  title: string;

  @Column({type: String, default: ''})
  subtitle: string;

  @Column({type: Boolean, default: true})
  isEnabled: boolean;

  @Column({type: String, default: ''})
  description: string;

  @Column({ type: "int" })
  consultantId: number;
  // member of organization
  @ManyToOne(type => Consultant)
  @JoinColumn({ name: "consultantId" })
  consultant: Consultant;

  @Column({type: String, nullable: true})
  calendlyEventType: string;

  // DB insert time
  @CreateDateColumn()
  public createdAt: Date;

  // DB last update time
  @UpdateDateColumn()
  public updatedAt: Date;

}
