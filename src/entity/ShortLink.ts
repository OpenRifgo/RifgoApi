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

export enum ShortLinkTypes {
  ConsultantReferralLink = 'ConsultantReferralLink',
  ConsultantSlug = 'ConsultantSlug',
  StreamerSlug = 'StreamerSlug',
}

@Entity()
export class ShortLink {

  @PrimaryGeneratedColumn()
  id: number;

  @Column({type: String})
  @Index({unique: true})
  uid: string;

  @Column({type: String})
  shortLinkType: ShortLinkTypes;

  // DB insert time
  @CreateDateColumn()
  public createdAt: Date;

}
