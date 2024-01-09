import { ApiProperty } from '@nestjs/swagger';

export class AddFriendResponseDto {
	@ApiProperty({description: 'Friendship ID', example: 1})
	id: number;

	@ApiProperty({description: 'User ID', example: 1})
	user_id: number;

	@ApiProperty({description: 'Sender ID', example: 2})
	sender_id: number;

	@ApiProperty({description: 'Username', example: 'user'})
	username: string;

	@ApiProperty({description: 'Avatar URL', example: 'https://example.com/avatar.png'})
	avatar: string;

	constructor(friendship_id: number, user_id: number, sender_id: number, username: string, avatar: string) {
		this.id = friendship_id;
		this.user_id = user_id;
		this.sender_id = sender_id;
		this.username = username;
		this.avatar = avatar;
	}
}
