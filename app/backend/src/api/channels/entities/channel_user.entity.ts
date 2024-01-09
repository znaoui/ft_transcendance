import { User } from '../../users/entities/user.entity';
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Channel } from './channel.entity';

@Entity('channel_users')
export class ChannelUser {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({nullable: false})
  user_id: number;

  @Column({nullable: false})
  channel_id: number;

  @Column({ type: 'smallint', default: 0})
  role: number;

  @Column()
  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE', eager: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Channel, { onDelete: 'CASCADE',  eager: true })
  @JoinColumn({ name: 'channel_id' })
  channel: Channel;

  constructor(partial: Partial<ChannelUser>) {
    Object.assign(this, partial);
  }
}

export enum ChannelUserRole {
	USER = 0,
	ADMIN = 1,
  OWNER = 2
}
