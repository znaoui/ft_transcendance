import { User } from '../../users/entities/user.entity';
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Channel } from './channel.entity';

@Entity('channel_mutes')
export class ChannelMute {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({nullable: false})
  channel_id: number;

  @Column({nullable: false})
  muted_user_id: number;

  @Column({nullable: false})
  muted_by_user_id: number;

  @Column({type: 'timestamp', nullable: false})
  muted_until: Date;

  @Column()
  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE', eager: true })
  @JoinColumn({ name: 'muted_user_id' })
  muted_user: User;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'muted_by_user_id' })
  muted_by: User;

  @ManyToOne(() => Channel, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'channel_id' })
  channel: Channel;

  constructor(partial: Partial<ChannelMute>) {
    Object.assign(this, partial);
  }
}
