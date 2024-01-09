import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('user_blocks')
export class UserBlock {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  blocker_user_id: number;

  @Column()
  blocked_user_id: number;

  @CreateDateColumn()
  created_date: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE', eager: true })
  @JoinColumn({ name: 'blocker_user_id' })
  blocker: User;

  @ManyToOne(() => User, { onDelete: 'CASCADE', eager: true })
  @JoinColumn({ name: 'blocked_user_id' })
  blockedUser: User;

  constructor(partial: Partial<UserBlock>) {
    Object.assign(this, partial);
  }
}
