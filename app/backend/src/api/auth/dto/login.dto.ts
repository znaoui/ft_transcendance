import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, MinLength, IsBoolean} from 'class-validator';

export class LoginDto {
	@ApiProperty({ description: 'Username' })
	@IsString()
	@IsNotEmpty()
	@MinLength(3)
	username: string;

	@ApiProperty({ description: 'Password' })
	@IsString()
	@IsNotEmpty()
	@MinLength(8)
	password: string;
  }

export class LoginResultDto {
	@ApiProperty({ description: 'Requires 2FA' })
	requires_totp: boolean;

	constructor(requires_totp: boolean) {
		this.requires_totp = requires_totp;
	}
}
