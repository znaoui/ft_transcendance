import { RefObject } from 'react';
import { Game, GameStatus, PlayerPowerupState} from './GameState';
import { Keys } from './Keys';

export type PaddleState = {
	y: number;
	width: number;
	height: number;
	speed: number;
	powerup: PlayerPowerupState | null;
}

export type EngineState = {
	canvasRef: RefObject<HTMLCanvasElement> | null,
	player1Paddle: PaddleState,
	player2Paddle: PaddleState,
	ballX: number,
	ballY: number,
	keys: Keys,
	game: Game,
}

export const engineState: EngineState = {
	canvasRef: null,
	player1Paddle: {
		y: 0,
		width: 10,
		height: 100,
		speed: 10,
		powerup: null,
	},
	player2Paddle: {
		y: 0,
		width: 10,
		height: 100,
		speed: 10,
		powerup: null,
	},
	ballX: 0,
	ballY: 0,
	game: {
		info: null,
		status: GameStatus.Aborted,
		state: null,
		old_state: null,
		my_player_id: 0,
		last_server_update: Date.now(),
		score_update: false,
	},
	keys: {
		up: { pressed: false },
		down: { pressed: false },
	},
};

export const resetEngineState = function() {
	engineState.game = {
		info: null,
		status: GameStatus.Aborted,
		state: null,
		old_state: null,
		my_player_id: 0,
		last_server_update: Date.now(),
		score_update: false,
	};
	engineState.canvasRef = null;
	engineState.ballX = 0;
	engineState.ballY = 0;
	engineState.player1Paddle = {
		y: 0,
		width: 10,
		height: 100,
		speed: 10,
		powerup: null,
	};
	engineState.player2Paddle = {
		y: 0,
		width: 10,
		height: 100,
		speed: 10,
		powerup: null,
	};
}
