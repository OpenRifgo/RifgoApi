import {
    Column,
    CreateDateColumn,
    Entity, Index,
    PrimaryGeneratedColumn,
} from 'typeorm/index';

@Entity()
export class OutClick {

    @PrimaryGeneratedColumn()
    id: number

    @Column({type: String, nullable: false})
    @Index()
    url: string

    @Column({type: String, nullable: true, default: null})
    source: string

    @Column({type: String, nullable: true, default: null})
    sourceId: string

    // DB insert time
    @CreateDateColumn()
    public createdAt: Date

}
