import { MatchFoundPayload } from "../dashboard/maincontent/models/matchmaking";

export enum GameStatus {
	Waiting,
	Running,
	PreGame,
	Paused,
	Finished,
	Aborted
}

type BallState = {
	x: number;
	y: number;
}

export enum PowerupType {
	SpeedBoost,
	PaddleExtension
}

export type PowerupState = {
	x: number;
	y: number;
	type: PowerupType;
}

export type PlayerPowerupState = {
	type: PowerupType;
	expiresAt: number;
}

export type PlayerState = {
	score: number;
	position: number;
	powerup: PlayerPowerupState | null;
}

export type Game = {
	info: MatchFoundPayload | null;
	status: GameStatus;
	my_player_id: number;
	state: GameState | null;
	old_state: GameState | null;
	last_server_update: number;
	score_update: boolean;
}

export type GameState = {
	players: PlayerState[];
	ball: BallState;
	powerups: PowerupState[];
}

export const defaultGameState: GameState = {
	players: [
		{
			score: 0,
			position: 0,
			powerup: null,
		},
		{
			score: 0,
			position: 0,
			powerup: null,
		},
	],
	ball: {
		x: 0,
		y: 0,
	},
	powerups: [],
};
