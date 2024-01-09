import { ApiProperty } from "@nestjs/swagger";
import { UserInfoDTO } from "../../common/dto/userinfo.dto";
import { PrivateMessageType } from "src/gateway/chat/models/message.entity";
import { ChannelUserRole } from "../entities/channel_user.entity";

export class MessageSenderDto extends UserInfoDTO {
	role: ChannelUserRole;

	constructor(id: number, username: string, avatar: string, role: ChannelUserRole) {
		super(id, username, avatar);
		this.role = role;
	}
}

export class ChannelMessageResponseDto {
	@ApiProperty({description: 'Channel ID'})
	id: number;

	@ApiProperty({description: 'Channel ID'})
	channel_id: number;

	@ApiProperty({description: 'Message type', enum: PrivateMessageType})
	type: number;

	@ApiProperty({description: 'User who sent the message'})
	sender: MessageSenderDto;

	@ApiProperty({description: 'Message content'})
	content: string;

	@ApiProperty({description: 'Message timestamp'})
	timestamp: number;

	constructor(id: number, channel_id: number, type: PrivateMessageType, sender: MessageSenderDto, content: string, created_at: Date) {
		this.id = id;
		this.channel_id = channel_id;
		this.type = type;
		this.sender = sender;
		this.content = content;
		this.timestamp = new Date(created_at).getTime();
	}
}
