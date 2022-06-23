import {
  Column,
  CreateDateColumn,
  Entity,
  Index, JoinColumn, ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'
import {User} from './User'

@Entity()
export class Image {

  @PrimaryGeneratedColumn()
  id: number;

  @Column({type: String})
  @Index({unique: true})
  uid: string;

  @Column({type: String})
  ext: string;

  @Column({type: "int", nullable: true})
  userId: number;
  @ManyToOne(type => User, {nullable: true})
  @JoinColumn({name: "userId"})
  user: User;

  @Column({type: "int", default: 0})
  @Index()
  index: number; // for ordering

  // DB insert time
  @CreateDateColumn()
  public createdAt: Date

  // DB last update time
  @UpdateDateColumn()
  public updatedAt: Date

}
