import { User } from '../../users/entities/user.entity';
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';

@Entity('channels')
export class Channel {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, nullable: true})
  name: string;

  @Column({ type: 'smallint', default: 0})
  type: number;

  @Column({ nullable: true})
  password: string;

  @Column({ nullable: false})
  owner_id: number;

  @Column({ default: 1})
  members_count: number;

  @Column()
  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  constructor(partial: Partial<Channel>) {
    Object.assign(this, partial);
  }
}

export enum ChannelType {
	PUBLIC = 0,
	PRIVATE = 1,
	PROTECTED = 2
}
