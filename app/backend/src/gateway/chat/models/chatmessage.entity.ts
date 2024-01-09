import { Channel } from 'src/api/channels/entities/channel.entity';
import { User } from '../../../api/users/entities/user.entity';
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';


@Entity('channel_messages')
export class ChannelMessage {
	@PrimaryGeneratedColumn()
	id: number;

	@Column({ type: 'smallint', default: 0 })
	type: number;

	@Column()
	channel_id: number;

	@Column()
	user_id: number;

	@Column({ type: 'smallint', default: 0})
	user_role: number;

	@Column()
	content: string;

	@CreateDateColumn()
	created_at: Date;

	@ManyToOne(() => Channel, { onDelete: 'CASCADE', eager: true })
	@JoinColumn({ name: 'channel_id' })
	channel: Channel;

	@ManyToOne(() => User, { onDelete: 'CASCADE', eager: true })
	@JoinColumn({ name: 'user_id' })
	user: User;

	constructor(partial: Partial<ChannelMessage>) {
		Object.assign(this, partial);
	}
}
