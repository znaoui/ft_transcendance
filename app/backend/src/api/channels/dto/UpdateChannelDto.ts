import {IsString, IsOptional, MinLength, MaxLength, Matches, IsEnum} from 'class-validator';
import { ChannelType } from '../entities/channel.entity';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateChannelDto
{
	@ApiPropertyOptional({description: 'Channel name, contains only letters, numbers and underscores, optional if not updating name', minLength: 3, maxLength: 15})
	@IsOptional()
	@MinLength(3)
	@MaxLength(15)
	@IsString()
	@Matches(/^[a-zA-Z0-9_]+$/, {
		message: 'Name must only contain letters, numbers and underscores',
	})
	name: string;

	@ApiPropertyOptional({ enum: ChannelType, enumName: 'ChannelType',  description: 'Channel type, optional if not updating type'})
	@IsOptional()
	@IsEnum(ChannelType)
	type: ChannelType;

	@ApiPropertyOptional({description: 'Channel password, optional if not updating password', minLength: 4, maxLength: 30})
	@IsOptional()
	@IsString()
	@MinLength(4)
	@MaxLength(30)
	password: string;
}
