export type InitialGameState = {
	player_id: number;
	start_time: number;
}

export type GameFinishedPayload = {
	score: [number, number];
	winner: {
		id: number;
		username: string;
		avatar: string;
	};
}

export type GamePausedPayload = {
	timeout_ts: number;
}
