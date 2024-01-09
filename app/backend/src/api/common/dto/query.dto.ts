import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, IsNumber, IsOptional, Max, Min } from "class-validator";

export class LimitQueryDto {
	@ApiProperty({ description: 'Number of items to return', example: 50})
	@IsInt()
	@Type(() => Number)
	@Min(1, { message: 'Page must be positive' })
	@IsOptional()
	limit: number = 20;
}
