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
export class ConsultantReview {

  @PrimaryGeneratedColumn()
  id: number;

  @Column({type: String})
  name: string;

  @Column({type: String, default: ''})
  text: string;

  @Column({type: Number, nullable: true})
  sessions: number;

  @Column({ type: "int" })
  consultantId: number;
  // member of organization
  @ManyToOne(type => Consultant)
  @JoinColumn({ name: "consultantId" })
  consultant: Consultant;

  // DB insert time
  @CreateDateColumn()
  public createdAt: Date;

  // DB last update time
  @UpdateDateColumn()
  public updatedAt: Date;

}
