import { ApiProperty } from "@nestjs/swagger";
import { UserInfoDTO } from "../../common/dto/userinfo.dto";

export class BannedUserDto {
	@ApiProperty({description: 'User'})
	user: UserInfoDTO;

	@ApiProperty({description: 'Banned by'})
	banned_by: UserInfoDTO;

	@ApiProperty({description: 'Banned timestamp'})
	banned_at: number;

	constructor(user: UserInfoDTO, banned_by: UserInfoDTO, banned_at: Date) {
		this.user = user;
		this.banned_by = banned_by;
		this.banned_at = banned_at.getTime();
	}
}
