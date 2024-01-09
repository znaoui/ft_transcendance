import { User } from '../../../api/users/entities/user.entity';
import { Entity, Column, CreateDateColumn, ManyToOne, JoinColumn, PrimaryColumn } from 'typeorm';

@Entity('game_stats')
export class GameStats {
	@PrimaryColumn()
	id: number;

	@Column({ nullable: false })
	player_1_user_id: number;

	@Column({ nullable: false})
	player_2_user_id: number;

	@Column({ nullable: false, default: 0})
	player_1_score: number;

	@Column({ nullable: false, default: 0})
	player_2_score: number;

	@Column({ nullable: false })
	player_1_paddle_hits: number;

	@Column({ nullable: false })
	player_2_paddle_hits: number;

	@Column({ nullable: false })
	player_1_wall_hits: number;

	@Column({ nullable: false })
	player_2_wall_hits: number;

	@Column({ nullable: false })
	player_1_top_paddle_hits: number;

	@Column({ nullable: false })
	player_2_top_paddle_hits: number;

	@Column({ nullable: false })
	player_1_bottom_paddle_hits: number;

	@Column({ nullable: false })
	player_2_bottom_paddle_hits: number;

	@Column({ nullable: false })
	player_1_largest_score_streak: number;

	@Column({ nullable: false })
	player_2_largest_score_streak: number;

	@Column({ nullable: false })
	total_play_time_seconds: number;

	@CreateDateColumn()
	created_at: Date;

	@ManyToOne(() => User)
	@JoinColumn({ name: 'player_1_user_id' })
	player1: User;

	@ManyToOne(() => User)
	@JoinColumn({ name: 'player_2_user_id' })
	player2: User;

	constructor(partial: Partial<GameStats>) {
		Object.assign(this, partial);
	}
}
