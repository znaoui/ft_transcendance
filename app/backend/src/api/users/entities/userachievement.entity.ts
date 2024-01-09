import { Entity, Column, ManyToOne, JoinColumn, PrimaryColumn, CreateDateColumn, PrimaryGeneratedColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('user_achievements')
export class UserAchievement {
	@PrimaryGeneratedColumn()
	id: number;

	@Column({ nullable: false })
	user_id: number;

	@Column({ nullable: false })
	game_id: number;

	@Column({ nullable: false })
	achievement_id: string;

	@Column({nullable: false})
	name: string;

	@Column({nullable: false})
	description: string;

	@Column({nullable: false})
	icon: string;

	@Column()
	@CreateDateColumn()
	created_at: Date;

	@ManyToOne(() => User, { onDelete: 'CASCADE', eager: true })
	@JoinColumn({ name: 'user_id' })
	user: User;

	constructor(partial: Partial<UserAchievement>) {
		Object.assign(this, partial);
	}
}
