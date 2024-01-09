import { User } from '../../../api/users/entities/user.entity';
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { GameStatus } from './game.class';


@Entity('games')
export class Game {
	@PrimaryGeneratedColumn()
	id: number;

	@Column({ type: 'smallint', nullable: false, default: 0 })
	status: GameStatus;

	@Column({ nullable: true, default: null})
	winner_id: number;

	@Column({ nullable: false })
	player_1_user_id: number;

	@Column({ nullable: false})
	player_2_user_id: number;

	@Column({ nullable: false, default: 0})
	player_1_score: number;

	@Column({ nullable: false, default: 0})
	player_2_score: number;

	@CreateDateColumn()
	created_at: Date;

	@CreateDateColumn()
	ended_at: Date;

	@ManyToOne(() => User)
	@JoinColumn({ name: 'player_1_user_id' })
	player1: User;

	@ManyToOne(() => User)
	@JoinColumn({ name: 'player_2_user_id' })
	player2: User;

	constructor(partial: Partial<Game>) {
		Object.assign(this, partial);
	}
}
