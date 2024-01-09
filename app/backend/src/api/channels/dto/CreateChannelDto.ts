import { IsNotEmpty, IsString, IsOptional, MinLength, MaxLength, Matches, IsEnum} from 'class-validator';
import { ChannelType } from '../entities/channel.entity';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateChannelDto
{
	@ApiProperty({description: 'Channel name, contains only letters, numbers and underscores', minLength: 3, maxLength: 15})
	@MinLength(3)
	@MaxLength(15)
	@IsString()
	@IsNotEmpty()
	@Matches(/^[a-zA-Z0-9_]+$/, {
		message: 'Name must only contain letters, numbers and underscores',
	})
	name: string;

	@ApiProperty({ enum: ChannelType, enumName: 'ChannelType',  description: 'Channel type'})
	@IsEnum(ChannelType)
	type: ChannelType;

	@ApiPropertyOptional({description: 'Channel password, optional if no password', minLength: 4, maxLength: 30})
	@IsOptional()
	@IsString()
	@MinLength(4)
	@MaxLength(30)
	password: string;
}

export class CreateChannelResponseDto {
	@ApiProperty({description: 'Channel ID', example: 1})
	id: number;

	@ApiProperty({description: 'Channel name', example: 'channel'})
	name: string;

	@ApiProperty({description: 'Channel type', enum: ChannelType})
	type: ChannelType;

	constructor(channel_id: number, name: string, type: ChannelType) {
		this.id = channel_id;
		this.name = name;
		this.type = type;
	}
}
