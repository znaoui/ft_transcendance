import { User } from '../../users/entities/user.entity';
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Channel } from './channel.entity';

@Entity('channel_invitations')
export class ChannelInvitation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({nullable: false})
  user_id: number;

  @Column({nullable: false})
  invited_by_user_id: number;

  @Column({nullable: false})
  channel_id: number;

  @Column()
  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE', eager: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => User, { onDelete: 'CASCADE', eager: true })
  @JoinColumn({ name: 'invited_by_user_id' })
  invited_by: User;

  @ManyToOne(() => Channel, { onDelete: 'CASCADE',  eager: true })
  @JoinColumn({ name: 'channel_id' })
  channel: Channel;

  constructor(partial: Partial<ChannelInvitation>) {
    Object.assign(this, partial);
  }
}
