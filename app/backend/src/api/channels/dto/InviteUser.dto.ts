import { ApiProperty } from '@nestjs/swagger';
import { UserInfoDTO } from "../../common/dto/userinfo.dto";
import { ChannelType } from '../entities/channel.entity';

export class InviteUserResponseDto extends UserInfoDTO {
	@ApiProperty({description: 'Invitation ID', example: 1})
	invitation_id: number;

	constructor(invitation_id: number, user_id: number, username: string, avatar: string) {
		super(user_id, username, avatar);
		this.invitation_id = invitation_id;
	}
}

export class UserChannelInvitationResponseDto {
	@ApiProperty({description: 'Invitation ID', example: 1})
	id: number;

	@ApiProperty({description: 'Channel ID', example: 1})
	channel_id: number;

	@ApiProperty({description: 'Channel name', example: 'general'})
	channel_name: string;

	@ApiProperty({description: 'Channel type', example: 0, enum: ChannelType})
	channel_type: number;

	@ApiProperty({description: 'Invitation timestamp', example: 1618225200})
	sent_at: number;

	constructor(id: number, channel_id: number, channel_name: string, channel_type: number, sent_at: Date) {
		this.id = id;
		this.channel_id = channel_id;
		this.channel_name = channel_name;
		this.channel_type = channel_type;
		this.sent_at = sent_at.getTime();
	}
}

export class InvitationResponseDto {
	@ApiProperty({description: 'Invitation ID', example: 1})
	id: number;

	@ApiProperty({description: 'Invited user information'})
	user: UserInfoDTO;

	@ApiProperty({description: 'Invitation sender information'})
	invited_by: UserInfoDTO;

	@ApiProperty({description: 'Invitation timestamp', example: 1618225200})
	invited_at: number;

	constructor(invitation_id: number, user: UserInfoDTO, invited_by: UserInfoDTO, invited_at: Date) {
		this.id = invitation_id;
		this.user = user;
		this.invited_by = invited_by;
		this.invited_at = invited_at.getTime();
	}
}
