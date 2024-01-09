import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber } from "class-validator";

export class GameInviteUserDto
{
	@ApiProperty({description: 'User ID', type: Number})
	@IsNotEmpty()
	@IsNumber()
	user_id: number;
}
