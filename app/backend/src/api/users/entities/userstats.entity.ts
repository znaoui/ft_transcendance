import { Entity, Column, UpdateDateColumn, ManyToOne, JoinColumn, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('user_stats')
export class UserStats {
	@PrimaryGeneratedColumn()
	id: number;

	@Column({ nullable: false })
	user_id: number;

	@Column({ default: 0 })
	rank: number;

	@Column({ default: 0 })
	games_played: number;

	@Column({ default: 0 })
	games_won: number;

	@Column({ default: 0 })
	games_lost: number;

	@Column({ default: 0 })
	win_streak: number;

	@Column({ default: 0 })
	total_paddle_hits: number;

	@Column({ default: 0 })
	total_points_scored: number;

	@Column({ default: 0 })
	total_play_time_seconds: number;

	@Column()
	@UpdateDateColumn()
	updated_at: Date;

	@ManyToOne(() => User, { onDelete: 'CASCADE', eager: true })
	@JoinColumn({ name: 'user_id' })
	user: User;

	constructor(partial: Partial<UserStats>) {
		Object.assign(this, partial);
	}
}
