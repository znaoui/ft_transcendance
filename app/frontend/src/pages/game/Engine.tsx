import { gameSocket } from '../../sockets/game';
import { GAME_CONSTANTS } from './Constants';
import { PaddleState, engineState, resetEngineState } from './EngineState';
import { GameStatus, PlayerState, PowerupType } from './GameState';
import { paddleExtensionPowerupImage, speedBoostPowerUpImage } from './Images';
import { lerp, normalizeXCoordinate, normalizeYCoordinate } from './Utils';

let canvas: HTMLCanvasElement;
let ctx: CanvasRenderingContext2D;
let frameId: number;
let keyPressInterval: NodeJS.Timeout;

export function initGame() {
	canvas = engineState.canvasRef!.current!;
	canvas.height = window.innerHeight;
	canvas.width = window.innerWidth;

	updateEngineState();
	bindEventListeners();

	// init positions
	engineState.player1Paddle.y = window.innerHeight / 2 - (window.innerHeight * GAME_CONSTANTS.PADDLE_CENTER_OFFSET);
	engineState.player2Paddle.y = window.innerHeight / 2 - (window.innerHeight * GAME_CONSTANTS.PADDLE_CENTER_OFFSET);
	engineState.ballX = canvas.width / 2 - (canvas.height * GAME_CONSTANTS.BALL_HEIGHT_OFFSET / 2);
	engineState.ballY = canvas.height / 2;

	keyPressInterval = setInterval(() => {
		if (engineState.game.status !== GameStatus.Running) return;
		if (engineState.keys.up.pressed) {
			gameSocket.emit('move_up');
		} else if (engineState.keys.down.pressed) {
			gameSocket.emit('move_down');
		}
	}, GAME_CONSTANTS.UPDATE_RATE);
	ctx = canvas.getContext('2d')!;

	loop();
}

function loop() {
	update();
	draw();
	frameId = requestAnimationFrame(loop);
}

export function cleanGame() {
	clearInterval(keyPressInterval);
	cancelAnimationFrame(frameId);
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	resetEngineState();
	unbindEventListeners();
}

function draw() {
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	drawBackground();
	drawScore();
	drawPaddles();
	drawCenterLine();
	drawBall();
	drawPowerups();
}

function update() {
	if (engineState.game.status !== GameStatus.Running || !engineState.game.state) return;

	updatePlayerPowerup(engineState.game.state.players[0], engineState.player1Paddle);
	updatePlayerPowerup(engineState.game.state.players[1], engineState.player2Paddle);

	let interpolationFactor = (Date.now() - engineState.game.last_server_update) / GAME_CONSTANTS.UPDATE_RATE;
	interpolationFactor = Math.min(1, interpolationFactor);
	interpolationFactor = Math.max(0, interpolationFactor);

	if (!engineState.game.old_state || engineState.game.old_state.ball.x < 0 || engineState.game.old_state.ball.x > 960) {
		engineState.ballX = normalizeXCoordinate(engineState.game.state.ball.x);
		engineState.ballY = normalizeYCoordinate(engineState.game.state.ball.y);
	} else {
		engineState.ballX = lerp(
			normalizeXCoordinate(engineState.game.old_state.ball.x),
			normalizeXCoordinate(engineState.game.state.ball.x),
			interpolationFactor
		);
		engineState.ballY = lerp(
			normalizeYCoordinate(engineState.game.old_state.ball.y),
			normalizeYCoordinate(engineState.game.state.ball.y),
			interpolationFactor
		);
	}

	if (!engineState.game.old_state) {
		engineState.player1Paddle.y = normalizeYCoordinate(engineState.game.state.players[0].position);
		engineState.player2Paddle.y = normalizeYCoordinate(engineState.game.state.players[1].position);
	} else {
		engineState.player1Paddle.y = lerp(
			normalizeYCoordinate(engineState.game.old_state.players[0].position),
			normalizeYCoordinate(engineState.game.state.players[0].position),
			interpolationFactor
		);
		engineState.player2Paddle.y = lerp(
			normalizeYCoordinate(engineState.game.old_state.players[1].position),
			normalizeYCoordinate(engineState.game.state.players[1].position),
			interpolationFactor
		);
	}
}

function updatePlayerPowerup(player: PlayerState, paddle: PaddleState) {
	if (paddle.powerup) {
		if (paddle.powerup.expiresAt < Date.now()) {
			paddle.powerup = null;
			resetPaddle(paddle);
		} else if (paddle.powerup.type === PowerupType.SpeedBoost) {
			paddle.speed = canvas.width * (GAME_CONSTANTS.PADDLE_SPEED_OFFSET * 1.5);
		} else if (paddle.powerup.type === PowerupType.PaddleExtension) {
			paddle.height = canvas.height * (GAME_CONSTANTS.PADDLE_HEIGHT_OFFSET * 2);
		}
	}
	if (player.powerup) {
		paddle.powerup = player.powerup;
	}
}

function drawPowerups() {
	if (!engineState.game.state) return;
	for (const powerup of engineState.game.state.powerups) {
		ctx.drawImage(
			powerup.type === PowerupType.SpeedBoost ? speedBoostPowerUpImage : paddleExtensionPowerupImage,
			normalizeXCoordinate(powerup.x),
			normalizeYCoordinate(powerup.y),
			canvas.width * 0.03,
			canvas.height * 0.07,
		);
	}
}

function drawBall() {
	ctx.fillStyle = GAME_CONSTANTS.BALL_COLOR;
	ctx.fillRect(
		engineState.ballX,
		engineState.ballY,
		canvas.height * GAME_CONSTANTS.BALL_HEIGHT_OFFSET,
		canvas.height * GAME_CONSTANTS.BALL_HEIGHT_OFFSET,
	);
}

function drawPaddles() {
	ctx.fillStyle = GAME_CONSTANTS.PLAYER_1_PADDLE_COLOR;
	ctx.fillRect(
		0,
		engineState.player1Paddle.y,
		engineState.player1Paddle.width,
		engineState.player1Paddle.height,
	);
	ctx.fillStyle = GAME_CONSTANTS.PLAYER_2_PADDLE_COLOR;
	ctx.fillRect(
		canvas.width - engineState.player2Paddle.width,
		engineState.player2Paddle.y,
		engineState.player2Paddle.width,
		engineState.player2Paddle.height,
	);
}

function drawScore() {
	ctx.font = canvas.height * GAME_CONSTANTS.SCORE_FONT_SIZE_OFFSET + 'px ' + GAME_CONSTANTS.SCORE_FONT;
	ctx.fillStyle = GAME_CONSTANTS.SCORE_COLOR;
	ctx.fillText(
		engineState.game.state?.players[0].score.toString() ?? '0',
		canvas.width / 4,
		canvas.height * 0.1,
	);
	ctx.fillText(
		engineState.game.state?.players[1].score.toString() ?? '0',
		canvas.width * 3 / 4,
		canvas.height * 0.1,
	);
}

function drawCenterLine() {
	ctx.beginPath();
	ctx.setLineDash(GAME_CONSTANTS.CENTER_LINE_DASH);
	ctx.moveTo((canvas.width / 2), canvas.height * GAME_CONSTANTS.CENTER_LINE_TOP_OFFSET);
	ctx.lineTo((canvas.width / 2), canvas.height * GAME_CONSTANTS.CENTER_LINE_BOTTOM_OFFSET);
	ctx.lineWidth = canvas.width * GAME_CONSTANTS.CENTER_LINE_WIDTH_OFFSET;
	ctx.strokeStyle = GAME_CONSTANTS.CENTER_LINE_COLOR;
	ctx.stroke();
}

function drawBackground() {
	ctx.fillStyle = '#000';
	ctx.fillRect(
		0,
		0,
		canvas.width,
		canvas.height
	);
}

function updateEngineState() {
	canvas.height = window.innerHeight;
	canvas.width = window.innerWidth;
	resetPaddle(engineState.player1Paddle);
	resetPaddle(engineState.player2Paddle);
}

function resetPaddle(paddle: PaddleState) {
	paddle.height = canvas.height * GAME_CONSTANTS.PADDLE_HEIGHT_OFFSET;
	paddle.width = canvas.width * GAME_CONSTANTS.PADDLE_WIDTH_OFFSET;
	paddle.speed = canvas.width * GAME_CONSTANTS.PADDLE_SPEED_OFFSET;
}

function onKeyDown(event: KeyboardEvent) {
	if (engineState.game.status !== GameStatus.Running) return;
	if (event.key === 'ArrowUp') {
		engineState.keys.up.pressed = true;
	} else if (event.key === 'ArrowDown') {
		engineState.keys.down.pressed = true;
	}
}

function onKeyUp(event: KeyboardEvent) {
	if (event.key === 'ArrowUp') {
		engineState.keys.up.pressed = false;
	} else if (event.key === 'ArrowDown') {
		engineState.keys.down.pressed = false;
	}
}

function bindEventListeners() {
	window.onresize = updateEngineState;
	window.onkeydown = onKeyDown;
	window.onkeyup = onKeyUp;
}

function unbindEventListeners() {
	window.onresize = null;
	window.onkeydown = null;
	window.onkeyup = null;
}
