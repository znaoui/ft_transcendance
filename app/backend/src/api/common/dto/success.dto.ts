import { ApiProperty } from "@nestjs/swagger";

export class SuccessResponseDTO {
	@ApiProperty({ description: 'Operation is success', example: true})
	success: boolean;

	constructor(success: boolean) {
		this.success = success;
	}
}
