import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches, Max, MaxLength, MinLength } from 'class-validator';


export class RegisterUserDto {
	@ApiProperty({description: 'Username', minLength: 3, maxLength: 30, example: 'john.doe'})
	@MinLength(3)
	@MaxLength(30)
	@IsString()
	@IsNotEmpty()
	@Matches(/^[a-zA-Z0-9_]+$/, {
		message: 'Username must only contain letters, numbers and underscores',
	})
	username: string;

	@ApiProperty({description: 'Password, must contain uppercase, lowercase and number', minLength: 8, maxLength: 72, example: 'Password123'})
	@MinLength(8)
	@MaxLength(72)
	@IsString()
	@IsNotEmpty()
	@Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/, {
		message: 'Password must contain at least one uppercase, one lowercase and one number',
	})
	password: string;

	@ApiProperty({description: 'Confirm password', minLength: 8, maxLength: 72, example: 'Password123'})
	@MinLength(8)
	@IsString()
	@IsNotEmpty()
	confirm_password: string;
  }
