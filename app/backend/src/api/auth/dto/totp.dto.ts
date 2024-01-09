import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';

export class VerifyTotpDto {
	@ApiProperty({description: 'TOTP Token', example: '123456'})
	@IsString()
	@IsNotEmpty()
	token: string;
  }

  export class SetupTotpDto {
	@ApiProperty({description: 'TOTP secret', minLength: 16, example: 'JBSWY3DPEHPK3PXP'})
	@Matches(/^[A-Z2-7]+=*$/)
	@MinLength(16)
	@IsString()
	@IsNotEmpty()
	secret: string;

	@ApiProperty({description: 'TOTP Token', example: '123456'})
	@IsString()
	@IsNotEmpty()
	token: string;
  }

  export class TotpGenerateDto {
	@ApiProperty({description: 'TOTP url to display as QR code'})
	url: string;
	constructor(secret: string) {
		this.url = secret;
	}
  }
