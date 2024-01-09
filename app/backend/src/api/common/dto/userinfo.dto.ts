import { ApiProperty } from "@nestjs/swagger";

export class UserInfoDTO {

	@ApiProperty({description: 'User ID', example: 1})
	user_id: number;

	@ApiProperty({description: 'Username', example: 'user'})
	username: string;

	@ApiProperty({description: 'Avatar URL', example: 'https://example.com/avatar.png'})
	avatar: string;

	constructor(user_id: number, username: string, avatar: string) {
		this.user_id = user_id;
		this.username = username;
		this.avatar = avatar;
	}
}
