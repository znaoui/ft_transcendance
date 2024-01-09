import { ApiProperty } from "@nestjs/swagger";
import { GameType } from "src/gateway/game/models/game.payloads";

export class UpdateUserResponseDTO {

	@ApiProperty({description: 'User ID', example: 1})
	id: number;

	@ApiProperty({description: 'Username', example: 'user'})
	username: string;

	@ApiProperty({description: 'Avatar URL', example: 'https://example.com/avatar.png'})
	avatar: string;

	@ApiProperty({description: 'OAuth enabled', example: true})
	oauth: boolean;

	@ApiProperty({description: '2FA enabled', example: true})
	has_2fa: boolean;

	@ApiProperty({description: 'Prefered game mode', example: 0, enum: GameType})
	prefered_mode: number;

	@ApiProperty({description: 'Account creation timestamp', example: 1618225200})
	created_at: number;

	constructor(id:number, username: string, avatar: string, is_oauth: boolean, has_2fa: boolean, mode: number, created_at: Date) {
		this.id = id;
		this.username = username;
		this.avatar = avatar;
		this.oauth = is_oauth;
		this.has_2fa = has_2fa;
		this.created_at = created_at.getTime();
		this.prefered_mode = mode;
	}
}

export class UpdateAvatarResultDTO {
	@ApiProperty({description: 'Avatar URL', example: 'https://example.com/avatar.png'})
	path: string;

	constructor(path: string) {
		this.path = path;
	}
}
