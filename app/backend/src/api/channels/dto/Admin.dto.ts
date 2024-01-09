import { ApiProperty } from "@nestjs/swagger";
import { UserInfoDTO } from "../../common/dto/userinfo.dto";

export class AdminUserResponseDto extends UserInfoDTO {
	@ApiProperty({description: 'Is channel owner'})
	is_owner: boolean;

	constructor(id: number, username: string, avatar: string, is_owner: boolean) {
		super(id, username, avatar);
		this.is_owner = is_owner;
	}
}
