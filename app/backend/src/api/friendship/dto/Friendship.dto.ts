import { ApiProperty } from "@nestjs/swagger";
import { PrivateMessage, PrivateMessageType } from "../../../gateway/chat/models/message.entity";
import { PresenceStatus } from "src/gateway/common/models/presence.status";

export class FriendshipResponseDTO {
	@ApiProperty({description: 'Friendship ID', example: 1})
	id: number;

	@ApiProperty({description: 'Friend user ID', example: 1})
	user_id: number;

	@ApiProperty({description: 'Username', example: 'user'})
	username: string;

	@ApiProperty({description: 'Sender avatar URL', example: 'https://example.com/avatar.png'})
	avatar: string;

	@ApiProperty({description: 'Presence status', enum: PresenceStatus, example: PresenceStatus.ONLINE})
	presence: number;

	constructor(friendship_id: number, user_id: number, username: string, avatar: string, presence: PresenceStatus) {
		this.id = friendship_id;
		this.user_id = user_id;
		this.username = username;
		this.avatar = avatar;
		this.presence = presence;
	}
}

export class FriendshipRequestsResponseDTO {
	@ApiProperty({description: 'Friendship ID', example: 1})
	id: number;

	@ApiProperty({description: 'User ID', example: 1})
	user_id: number;

	@ApiProperty({description: 'Sender user ID', example: 1})
	sender_id: number;

	@ApiProperty({description: 'Username', example: 'user'})
	username: string;

	@ApiProperty({description: 'Sender avatar URL', example: 'https://example.com/avatar.png'})
	avatar: string;

	@ApiProperty({description: 'Friendship status'})
	sent_at: number;

	constructor(friendship_id: number, user_id: number, sender_id: number, username: string, avatar: string, sent: Date) {
		this.id = friendship_id;
		this.user_id = user_id;
		this.sender_id = sender_id;
		this.username = username;
		this.avatar = avatar;
		this.sent_at = sent.getTime();
	}
}

export class PrivateMessageResponse {
	@ApiProperty({description: 'Message ID', example: 1})
	id: number;

	@ApiProperty({description: 'Message type', example: 0, enum: PrivateMessageType})
	type: PrivateMessageType;

	@ApiProperty({description: 'Sender user ID', example: 1})
	sender_id: number;

	@ApiProperty({description: 'Receiver user ID', example: 2})
	receiver_id: number;

	@ApiProperty({description: 'Content', example: 'Hello world!'})
	content: string;

	@ApiProperty({description: 'Sent at', example: 1616161616161})
	timestamp: number;

	constructor(message: PrivateMessage) {
		this.id = message.id;
		this.type = message.type;
		this.sender_id = message.sender_id;
		this.receiver_id = message.receiver_id;
		this.content = message.content;
		this.timestamp = message.created_at.getTime();
	}
}
