import { User } from '../../../api/users/entities/user.entity';
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ChatResponse } from './chatresponse';

@Entity('private_messages')
export class PrivateMessage {
	@PrimaryGeneratedColumn()
	id: number;

	@Column({ type: 'smallint', default: 0 })
	type: number;

	@Column()
	sender_id: number;

	@Column()
	receiver_id: number;

	@Column()
	content: string;

	@CreateDateColumn()
	created_at: Date;

	@ManyToOne(() => User, { onDelete: 'CASCADE', eager: true })
	@JoinColumn({ name: 'sender_id' })
	sender: User;

	@ManyToOne(() => User, { onDelete: 'CASCADE', eager: true })
	@JoinColumn({ name: 'receiver_id' })
	receiver: User;

	constructor(partial: Partial<PrivateMessage>) {
		Object.assign(this, partial);
	  }
}

export enum PrivateMessageType {
	MESSAGE = 0,
	GAME_INVITE = 1,
}

export type PrivateMessageData = {
	type: PrivateMessageType;
	user_id: number;
	content: string;
}

export class PrivateMessageResponse extends ChatResponse {
	id: number;

	constructor(message_id: number) {
		super(true, null);
		this.id = message_id;
	}
}

export type ChannelMessageData = {
	type: ChannelMessageType;
	channel_id: number;
	content: string;
}

export enum ChannelMessageType {
	MESSAGE = 0,
	GAME_INVITE = 1,
	EVENT = 2,
}

export class ChannelMessageResponse extends ChatResponse {
	id: number;

	constructor(message_id: number) {
		super(true, null);
		this.id = message_id;
	}
}
