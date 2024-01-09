import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsOptional, MinLength, Min } from "class-validator";

export class SearchUserDto {
	@ApiProperty({description: "Username to search"})
	@IsNotEmpty()
	username: string;

	@ApiProperty({description: "Page number"})
	@IsOptional()
	@IsNumber()
	@Min(1)
	page: number = 1;
}
