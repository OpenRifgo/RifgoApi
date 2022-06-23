import {
  Column,
  CreateDateColumn,
  Entity, Index,
  ManyToOne,
  PrimaryGeneratedColumn, RelationId,
  UpdateDateColumn,
} from 'typeorm/index';
import {ILoggerLevels} from 'bricks-ts-logger'


@Entity()
export class Log {

  @PrimaryGeneratedColumn({type: 'bigint'})
  id: number;

  @Column({type: String, nullable: false})
  @Index()
  level: ILoggerLevels;

  @Column({type: String, default: ''})
  message: string;

  @Column({
    type: 'jsonb',
    array: false,
    default: () => "'{}'",
    nullable: false,
  })
  data: object;

  // DB insert time
  @CreateDateColumn()
  public createdAt: Date

}
