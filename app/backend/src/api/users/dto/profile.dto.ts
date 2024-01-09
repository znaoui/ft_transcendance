import { Game } from "src/gateway/game/models/game.entity";
import { UserStats } from "../entities/userstats.entity";
import { ApiProperty } from "@nestjs/swagger";
import { UserAchievement } from "../entities/userachievement.entity";
import { User } from "../entities/user.entity";

export class UserProfileStats {

	@ApiProperty({description: 'Rank', example: 1})
	rank: number;

	@ApiProperty({description: 'Games played', example: 1})
	games_played: number;

	@ApiProperty({description: 'Games won', example: 1})
	games_won: number;

	@ApiProperty({description: 'Games lost', example: 1})
	games_lost: number;

	@ApiProperty({description: 'Win streak', example: 1})
	win_streak: number;

	@ApiProperty({description: 'Total points scored', example: 1})
	total_points_scored: number;

	@ApiProperty({description: 'Total paddle hits', example: 1})
	total_paddle_hits: number;

	@ApiProperty({description: 'Total play time in seconds', example: 1})
	total_play_time_seconds: number;

	constructor(stats: UserStats) {
		this.rank = stats.rank;
		this.games_played = stats.games_played;
		this.games_won = stats.games_won;
		this.games_lost = stats.games_lost;
		this.win_streak = stats.win_streak;
		this.total_points_scored = stats.total_points_scored;
		this.total_paddle_hits = stats.total_paddle_hits;
		this.total_play_time_seconds = stats.total_play_time_seconds;
	}
}

export class UserGameHistory {
	@ApiProperty({description: 'Game ID', example: 1})
	id: number;

	@ApiProperty({description: 'Winner ID', example: 1})
	winner_id: number;

	@ApiProperty({description: 'Player 1', type: UserProfileStats})
	player1: {
		id: number;
		username: string;
		avatar: string;
		score: number;
	};

	@ApiProperty({description: 'Player 2', type: UserProfileStats})
	player2: {
		id: number;
		username: string;
		avatar: string;
		score: number;
	};

	@ApiProperty({description: 'Game date', example: '2021-01-01T00:00:00.000Z'})
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

export class UserGameAchievement {
	@ApiProperty({description: 'Achievement ID', example: 'sharpshooter'})
	id: string;

	@ApiProperty({description: 'Achievement name', example: 'Sharpshooter'})
	name: string;

	@ApiProperty({description: 'Achievement description', example: 'Win a game with 100% accuracy'})
	description: string;

	@ApiProperty({description: 'Achievement icon URL', example: 'https://example.com/achievement.png'})
	icon: string;

	constructor(achievement: UserAchievement) {
		this.id = achievement.achievement_id;
		this.name = achievement.name;
		this.description = achievement.description;
		this.icon = achievement.icon;
	}
}

export class UserProfile {
	@ApiProperty({description: 'User ID', example: 1})
	id: number;

	@ApiProperty({description: 'Username', example: 'username'})
	username: string;

	@ApiProperty({description: 'Avatar URL', example: 'https://example.com/avatar.png'})
	avatar: string;

	@ApiProperty({description: 'User stats', type: UserProfileStats})
	stats: UserProfileStats;

	@ApiProperty({description: 'User games history', type: UserGameHistory, isArray: true})
	history: UserGameHistory[];

	@ApiProperty({description: 'User achievements', type: UserGameAchievement, isArray: true})
	achievements: UserGameAchievement[];

	@ApiProperty({description: 'Date of registration', example: '2021-01-01T00:00:00.000Z'})
	joined_at: Date;

	constructor(user: User, stats: UserStats, history: Game[], achievements: UserAchievement[]) {
		this.id = user.id;
		this.username = user.username;
		this.avatar = user.avatar;
		this.stats = new UserProfileStats(stats);
		this.history = history.map((game) => new UserGameHistory(game));
		this.achievements = achievements.map((achievement) => new UserGameAchievement(achievement));
		this.joined_at = user.created_at;
	}
}
