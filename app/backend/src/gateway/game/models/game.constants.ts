const OFFSETS = {
	PADDLE_INITIAL_POS_OFFSET: 0.07,
	PADDLE_HEIGHT_OFFSET: 0.15,
	PADDLE_WIDTH_OFFSET: 0.015,
	PADDLE_SPEED_OFFSET: 0.02,

	BALL_HEIGHT_OFFSET: 0.025,
	BALL_RADIUS_OFFSET: 0.015,
	BALL_Y_VELOCITY_OFFSET: 0.01,
	BALL_X_VELOCITY_OFFSET: 0.01,

	POWERUP_HEIGHT_OFFSET: 0.07,
	POWERUP_WIDTH_OFFSET: 0.03,
};

const ENGINE_RESOLUTION_WIDTH = 960;
const ENGINE_RESOLUTION_HEIGHT = 540;

const GAME_CONSTANTS = {
	JOIN_GAME: "join_game",
	MOVE_UP: "move_up",
	MOVE_DOWN: "move_down",

	SCORE_LIMIT: 5,

	PLAYER_RECONNECT_TIMEOUT: 1000 * 60 * 2, // 2 minutes
	WAITING_FOR_PLAYERS_TIMEOUT: 1000 * 20, // 20 seconds
	PRE_GAME_COUNTDOWN: 1000 * 10, // 10 seconds

	ENGINE_RESOLUTION_WIDTH: ENGINE_RESOLUTION_WIDTH,
	ENGINE_RESOLUTION_HEIGHT: ENGINE_RESOLUTION_HEIGHT,

	PADDLE_HIT_ANGLE_RANGE: 0.7,
	PADDLE_SPEED: ENGINE_RESOLUTION_WIDTH * OFFSETS.PADDLE_SPEED_OFFSET,

	BALL_INITIAL_SPEED: 12,
	BALL_SPEED_INCREASE_FACTOR: 1.10,
	BALL_SPEED_DAMPEN_FACTOR: 0.95,
	BALL_SPAWN_MIN_ANGLE: (-60 * Math.PI) / 180,
	BALL_SPAWN_MAX_ANGLE: (60 * Math.PI) / 180,

	POWERUP_FLOATING_AMPLITUDE: 3,
	POWERUP_FLOATING_FREQUENCY: 0.06,

	SCORE_DELAY: 1000 * 2,

	TICK_RATE: 1000 / 30,
};

export { GAME_CONSTANTS, OFFSETS };
