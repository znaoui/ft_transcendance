import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, MinLength } from "class-validator";

export class UserActionDto {
	@ApiProperty({description: 'User ID'})
	@IsNotEmpty()
	@IsNumber()
	user_id: number;
}

export class UsernameActionDto {
	@ApiProperty({description: 'Username'})
	@IsNotEmpty()
	@MinLength(3)
	username: string;
}
