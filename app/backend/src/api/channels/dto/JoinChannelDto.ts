import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional} from 'class-validator';
import { ChannelUserRole } from '../entities/channel_user.entity';
import { UserInfoDTO } from '../../common/dto/userinfo.dto';
import { User } from 'src/api/users/entities/user.entity';
import { ChannelType } from '../entities/channel.entity';

export class JoinChannelDto {
	@ApiPropertyOptional({description: 'Channel password, optional if no password'})
	@IsOptional()
	@IsString()
	@IsNotEmpty()
	password: string;
}

export class JoinChannelByNameDto extends JoinChannelDto {

	@ApiProperty({description: 'Channel name'})
	@IsString()
	@IsNotEmpty()
	name: string;
}

export class JoinedChannelResponseDto {
	@ApiProperty({description: 'Channel id', example: 1})
	id: number;

	@ApiProperty({description: 'Channel name', example: 'Channel name'})
	name: string;

	constructor(id: number, name: string) {
		this.id = id;
		this.name = name;
	}
}

export class UserChannelResponseDto {
	@ApiProperty({description: 'Channel id', example: 1})
	id: number;

	@ApiProperty({description: 'Channel type', example: 0, enum: ChannelType})
	type: number;

	@ApiProperty({description: 'Channel name', example: 'Channel name'})
	name: string;

	@ApiProperty({description: 'Role in channel', enum: ChannelUserRole})
	role: ChannelUserRole;

	constructor(id: number, type: number, name: string, role: ChannelUserRole) {
		this.id = id;
		this.type = type;
		this.name = name;
		this.role = role;
	}
}

export class ChannelUserResponseDto extends UserInfoDTO {
	@ApiProperty({description: 'User channel\'s role', enum: ChannelUserRole})
	role: ChannelUserRole;

	@ApiProperty({description: 'Joined at timestamp', example: 1618225200})
	joined_at: number;

	constructor(id: number, username: string, avatar: string, role: ChannelUserRole, joined_at: Date) {
		super(id, username, avatar);
		this.role = role;
		this.joined_at = joined_at.getTime();
	}
}
