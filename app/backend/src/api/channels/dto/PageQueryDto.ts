import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, Min} from 'class-validator';

export class PageQueryDto {
	@ApiProperty({ description: 'Page number, must be positive', minimum: 1})
	@IsInt()
	@Type(() => Number)
	@Min(1, { message: 'Page must be positive' })
	page: number = 1;
}
