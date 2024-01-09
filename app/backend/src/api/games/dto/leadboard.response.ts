import { ApiProperty } from "@nestjs/swagger";
import { UserStats } from "src/api/users/entities/userstats.entity";

export class LeaderboardEntry {

	@ApiProperty({description: 'User ID', example: 1})
	id: number;

	@ApiProperty({description: 'Username', example: 'username'})
	username: string;

	@ApiProperty({description: 'Avatar', example: 'avatar'})
	avatar: string;

	@ApiProperty({description: 'Rank', example: 1})
	rank: number;

	@ApiProperty({description: 'Total wins', example: 5})
	total_wins: number;

	@ApiProperty({description: 'Total points scored', example: 100})
	total_points_scored: number;

	@ApiProperty({description: 'Total play time in seconds', example: 3600})
	total_play_time_seconds: number;

	constructor(stats: UserStats) {
		this.id = stats.user.id;
		this.username = stats.user.username;
		this.avatar = stats.user.avatar;
		this.rank = stats.rank;
		this.total_wins = stats.games_won;
		this.total_points_scored = stats.total_points_scored;
		this.total_play_time_seconds = stats.total_play_time_seconds;
	}
}
