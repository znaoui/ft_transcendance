import { ApiProperty } from '@nestjs/swagger';
import { IsDate, IsNotEmpty, IsNumber, Min} from 'class-validator';
import { UserInfoDTO } from "../../common/dto/userinfo.dto";

export class MuteUserDto
{
	@ApiProperty({description: 'User ID'})
	@IsNotEmpty()
	@IsNumber()
	user_id: number;

	@ApiProperty({description: 'Timestamp of unmute', minimum: 10})
	@IsNotEmpty()
	@IsNumber()
	until: number;
}

export class MutedUserResponseDto {
	@ApiProperty({description: 'User'})
	user: UserInfoDTO;

	@ApiProperty({description: 'Muted by'})
	muted_by: UserInfoDTO;

	@ApiProperty({description: 'Muted until date'})
	muted_until: number;

	@ApiProperty({description: 'Muted timestamp', example: 1618225200})
	muted_at: number;

	constructor(user: UserInfoDTO, muted_by: UserInfoDTO, muted_until: Date, muted_at: Date) {
		this.user = user;
		this.muted_by = muted_by;
		this.muted_until = muted_until.getTime();
		this.muted_at = muted_at.getTime();
	}
}
