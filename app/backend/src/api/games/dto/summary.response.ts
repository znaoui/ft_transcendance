import { UserAchievement } from "src/api/users/entities/userachievement.entity";
import { Game } from "src/gateway/game/models/game.entity";
import { GameStats } from "src/gateway/game/models/gamestats.entity";

export class GameSummaryResponse {
	id: number;
	winner_id: number;
	score: [number, number];
	player1: {
		id: number;
		username: string;
		avatar: string;
		paddle_hits: number;
		wall_hits: number;
		top_paddle_hits: number;
		bottom_paddle_hits: number;
		largest_score_streak: number;
	};
	player2: {
		id: number;
		username: string;
		avatar: string;
		paddle_hits: number;
		wall_hits: number;
		top_paddle_hits: number;
		bottom_paddle_hits: number;
		largest_score_streak: number;
	};
	unlocked_achievements: UnlockedAchievement[];
	duration_seconds: number;

	constructor(game: Game, stats: GameStats, achievements: UserAchievement[]) {
		this.id = game.id;
		this.winner_id = game.winner_id;
		this.player1 = {
			id: game.player1.id,
			username: game.player1.username,
			avatar: game.player1.avatar,
			paddle_hits: stats.player_1_paddle_hits,
			wall_hits: stats.player_1_wall_hits,
			top_paddle_hits: stats.player_1_top_paddle_hits,
			bottom_paddle_hits: stats.player_1_bottom_paddle_hits,
			largest_score_streak: stats.player_1_largest_score_streak,
		};
		this.player2 = {
			id: game.player2.id,
			username: game.player2.username,
			avatar: game.player2.avatar,
			paddle_hits: stats.player_2_paddle_hits,
			wall_hits: stats.player_2_wall_hits,
			top_paddle_hits: stats.player_2_top_paddle_hits,
			bottom_paddle_hits: stats.player_2_bottom_paddle_hits,
			largest_score_streak: stats.player_2_largest_score_streak,
		};
		this.score = [stats.player_1_score, stats.player_2_score];
		this.duration_seconds = stats.total_play_time_seconds;
		this.unlocked_achievements = achievements.map(achievement => {
			return {
				name: achievement.name,
				description: achievement.description,
				icon: achievement.icon,
			};
		});
	}
};

export class UnlockedAchievement {
	name: string;
	description: string;
	icon: string;
}
