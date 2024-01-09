import { ApiProperty } from "@nestjs/swagger";
import { Game } from "src/gateway/game/models/game.entity";

export class GameHistoryResponse {
	@ApiProperty({description: 'Game ID', example: 1})
	id: number;

	@ApiProperty({description: 'Winner ID', example: 1})
	winner_id: number;

	@ApiProperty({description: 'Player 1 data', type: {
		id: {type: 'number', example: 1},
		username: {type: 'string', example: 'username'},
		avatar: {type: 'string', example: 'avatar'},
		score: {type: 'number', example: 5},
	}})
	player1: {
		id: number;
		username: string;
		avatar: string;
		score: number;
	};

	@ApiProperty({description: 'Player 2 data', type: {
		id: {type: 'number', example: 2},
		username: {type: 'string', example: 'username'},
		avatar: {type: 'string', example: 'avatar'},
		score: {type: 'number', example: 3},
	}})
	player2: {
		id: number;
		username: string;
		avatar: string;
		score: number;
	};

	@ApiProperty({description: 'Date', example: '2021-06-01T00:00:00.000Z'})
	date: Date;

	constructor(game: Game) {
		this.id = game.id;
		this.winner_id = game.winner_id;
		this.player1 = {
			id: game.player1.id,
			username: game.player1.username,
			avatar: game.player1.avatar,
			score: game.player_1_score,
		};
		this.player2 = {
			id: game.player2.id,
			username: game.player2.username,
			avatar: game.player2.avatar,
			score: game.player_2_score,
		};
		this.date = game.created_at;
	}
}
