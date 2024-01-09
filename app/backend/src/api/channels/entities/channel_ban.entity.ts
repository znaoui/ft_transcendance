import { User } from '../../users/entities/user.entity';
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Channel } from './channel.entity';

@Entity('channel_bans')
export class ChannelBan {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({nullable: false})
  channel_id: number;

  @Column({nullable: false})
  banned_user_id: number;

  @Column({nullable: false})
  banned_by_user_id: number;

  @Column()
  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE', eager: true })
  @JoinColumn({ name: 'banned_user_id' })
  banned_user: User;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'banned_by_user_id' })
  banned_by: User;

  @ManyToOne(() => Channel, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'channel_id' })
  channel: Channel;

  constructor(partial: Partial<ChannelBan>) {
    Object.assign(this, partial);
  }
}
