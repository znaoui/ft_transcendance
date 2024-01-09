import { User } from '../users/entities/user.entity';
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn, OneToOne } from 'typeorm';

@Entity('friendships')
export class Friendship {
	@PrimaryGeneratedColumn()
	id: number;

	@Column()
	sender_id: number;

	@Column()
	receiver_id: number;

	@Column({ type: 'smallint' })
	status: number;

	@CreateDateColumn()
	created_at: Date;

	@ManyToOne(() => User, { onDelete: 'CASCADE', eager: true })
	@JoinColumn({ name: 'sender_id' })
	sender: User;

	@ManyToOne(() => User, { onDelete: 'CASCADE', eager: true })
	@JoinColumn({ name: 'receiver_id' })
	receiver: User;

	constructor(partial: Partial<Friendship>) {
		Object.assign(this, partial);
	  }
}

export enum FriendshipStatus {
	PENDING = 0,
	ACCEPTED = 1,
	REJECTED = 2,
	DELETED = 3,
}
