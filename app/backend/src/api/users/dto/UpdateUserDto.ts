import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, MinLength, MaxLength, Matches} from 'class-validator';

export class UpdateUserDto {
	@ApiPropertyOptional({description: 'Email, optional if no update', minLength: 3, maxLength: 30})
	@MinLength(3)
	@MaxLength(30)
	@IsString()
	@IsNotEmpty()
	@IsOptional()
	@Matches(/^[a-zA-Z0-9_]+$/, {
		message: 'Username must only contain letters, numbers and underscores',
	})
	username: string;

	@ApiPropertyOptional({description: 'Old password, required if updating password, otherwise optional', minLength: 8, maxLength: 72})
	@IsOptional()
	@MinLength(8)
	@MaxLength(72)
	@IsString()
	@IsNotEmpty()
	old_password: string;

	@ApiPropertyOptional({description: 'New password, required if updating password, otherwise optional', minLength: 8, maxLength: 72})
	@IsOptional()
	@MinLength(8)
	@MaxLength(72)
	@IsString()
	@IsNotEmpty()
	@Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/, {
		message: 'Password must contain at least one uppercase, one lowercase and one number',
	})
	new_password: string;

	@ApiPropertyOptional({description: 'Confirm password, required if updating password, otherwise optional', minLength: 8, maxLength: 72})
	@IsOptional()
	@MinLength(8)
	@MaxLength(72)
	@IsString()
	@IsNotEmpty()
	confirm_password: string;
  }
