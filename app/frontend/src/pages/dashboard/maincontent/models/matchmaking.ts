export type MatchmakingResponse = {
	success: boolean;
	error?: string;
}

export enum MatchmakingType {
	CLASSIC = 0,
	POWERUPS = 1
}

export type MatchFoundPayload = {
	game_id: number;
	timeout: number;
	opponent: {
		id: number;
		username: string;
		avatar: string;
	};
}
