import { ApiProperty } from "@nestjs/swagger";

export class ErrorDTO {
	@ApiProperty({ description: 'Http status code', example: 400 })
	statusCode: number;

	@ApiProperty({ description: 'Error message', example: 'Invalid parameters' })
	message: string;

	constructor(code: number, message: string) {
		this.message = message;
		this.statusCode = code;
	}
}
