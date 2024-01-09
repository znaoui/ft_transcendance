export class UnlockedAchievement {
	name: string;
	description: string;
	icon: string;
}

export class GameSummary {
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
};
