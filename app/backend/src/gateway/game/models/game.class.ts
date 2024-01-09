import { Logger } from "@nestjs/common";
import { GAME_CONSTANTS, OFFSETS } from "./game.constants";
import { User } from "./user.entity";
import { GamePausedPayload } from "./game.payloads";
import * as Lock from "async-lock";
import { UserStats } from "src/api/users/entities/userstats.entity";
import { PlayerStats } from "./gamestats.class";

export enum GameStatus {
	Waiting,
	Running,
	PreGame,
	Paused,
	Finished,
	Aborted
}

type PlayerPowerupState = {
	type: PowerUpType;
	expiresAt: number;
}

type PlayerState = {
	score: number;
	position: number;
	powerup: PlayerPowerupState | null;
}

type BallState = {
	x: number;
	y: number;
}

enum CollisionSide {
	Top,
	Bottom,
  }

type Ball = {
	x: number;
	y: number;
	vx: number;
	vy: number;
	height: number;
	width: number;
}

type PowerupState = {
	x: number;
	y: number;
	type: PowerUpType;
}

type GameState = {
	players: PlayerState[];
	ball: BallState;
	powerups: PowerupState[];
}

type InitialGameState = {
	player_id: number,
	start_time: number,
}

const _gameLock = new Lock();

export class PongGame {
	private _id: number;
	private _status: GameStatus;
	private _player1: Player;
	private _player2: Player;
	private _ball: Ball;
	private _logger: Logger;
	private _startTime: number;
	private _lastScoringPlayer: Player;
	private _lastScoredTimestamp: number;
	private _abortTimeout: NodeJS.Timeout;
	private _loopTimeout: NodeJS.Timeout;
	private _updateInterval: NodeJS.Timeout;
	private _lastPaddleHitPlayer: Player;
	private _ballHitWall: boolean;
	private _powerupManager: PowerUpManager | null;
	private _powerupsEnabled: boolean;

	public onGameFinished: (game: PongGame, winner: Player | null) => void;

	constructor(enablePowerups: boolean) {
		this._logger = new Logger(`PongGame`);
		this._powerupsEnabled = enablePowerups;
		this._status = GameStatus.Waiting;
		this._ball = {
			x: GAME_CONSTANTS.ENGINE_RESOLUTION_WIDTH / 2 - (GAME_CONSTANTS.ENGINE_RESOLUTION_HEIGHT * OFFSETS.BALL_HEIGHT_OFFSET / 2),
			y: GAME_CONSTANTS.ENGINE_RESOLUTION_HEIGHT / 2,
			vx: 0,
			vy: 0,
			height: GAME_CONSTANTS.ENGINE_RESOLUTION_HEIGHT * OFFSETS.BALL_HEIGHT_OFFSET,
			width: GAME_CONSTANTS.ENGINE_RESOLUTION_HEIGHT * OFFSETS.BALL_HEIGHT_OFFSET,
		}
		this._startTime = Date.now() + GAME_CONSTANTS.WAITING_FOR_PLAYERS_TIMEOUT;
		if (enablePowerups) {
			this._powerupManager = new PowerUpManager();
		}
		const that = this;
		this._abortTimeout = setTimeout(function() {
			that.determineGameResult();
		}, this._startTime - Date.now());
	}

	get id(): number {
		return this._id;
	}

	get status(): GameStatus {
		return this._status;
	}

	get player1(): Player {
		return this._player1;
	}

	get player2(): Player {
		return this._player2;
	}

	get startTime(): number {
		return this._startTime;
	}

	set status(status: GameStatus) {
		this._status = status;
		this.sendGameStatusUpdate();
	}

	set id(id: number) {
		this._id = id;
	}

	set player1(player: Player) {
		this._logger.debug(`Player 1 joined the game`);
		this._player1 = player;
	}

	set player2(player: Player) {
		this._logger.debug(`Player 2 joined the game`);
		this._player2 = player;
	}

	public onPlayerDisconnect(user: User): void {
		const disconnectedPlayer = this.getPlayer(user);
		if (!disconnectedPlayer) {
			return;
		}
		this._logger.debug(`Player ${disconnectedPlayer.user.username} disconnected`);
		if (this._status !== GameStatus.Finished && this._status !== GameStatus.Aborted) {
				_gameLock.acquire(`game_${this._id}`, () => {
					this.status = GameStatus.Paused;
					this._powerupManager?.pause();
					this.clearTimeoutsIntervals();
					disconnectedPlayer.status = PlayerStatus.NotReady;
					const onlinePlayer = disconnectedPlayer === this._player1 ? this._player2 : this._player1;
					if (onlinePlayer.status === PlayerStatus.NotReady) {
						this.status = GameStatus.Aborted;
						this.onGameFinished(this, null);
						return;
					} else if (disconnectedPlayer.hasDisconnectedOnce) {
						this.determineGameResult();
						return;
					}
					disconnectedPlayer.hasDisconnectedOnce = true;
					const that = this;
					this._startTime = Date.now() + GAME_CONSTANTS.PLAYER_RECONNECT_TIMEOUT;
					this._abortTimeout = setTimeout(function() {
						that.determineGameResult();
					}, this._startTime - Date.now());
					const payload: GamePausedPayload = {
						timeout_ts: that._startTime + 2000,
					};
					onlinePlayer.user.socket.emit("game_paused", payload);
			});
		}
	}

	public getPlayer(user: User): Player | null {
		if (this._player1.user.user_id === user.user_id) {
			return this._player1;
		} else if (this._player2.user.user_id === user.user_id) {
			return this._player2;
		}
		return null;
	}

	public startGame(): void {
		this._logger.debug(`Starting game ${this._id}`);
		this.status = GameStatus.PreGame;
		this._startTime = Date.now() + GAME_CONSTANTS.PRE_GAME_COUNTDOWN;
		const initialGameState: InitialGameState = {
			player_id: this.player1.id,
			start_time: this._startTime
		}
		this._player1.user.socket.emit("initial_game_state", initialGameState);
		initialGameState.player_id = this.player2.id;
		this._player2.user.socket.emit("initial_game_state", initialGameState);
		const randomSide = Math.random() > 0.5 ? 1 : -1;
		const randomAngle = GAME_CONSTANTS.BALL_SPAWN_MIN_ANGLE + Math.random() * (GAME_CONSTANTS.BALL_SPAWN_MAX_ANGLE - GAME_CONSTANTS.BALL_SPAWN_MIN_ANGLE)
		this._ball.vx = GAME_CONSTANTS.BALL_INITIAL_SPEED * randomSide * Math.cos(randomAngle);
		this._ball.vy = GAME_CONSTANTS.BALL_INITIAL_SPEED * Math.sin(randomAngle);
		clearInterval(this._abortTimeout);
		this._player1.stats.onGameStart();
		this._player2.stats.onGameStart();
		const that = this;
		this._loopTimeout = setTimeout(function() {
			that.status = GameStatus.Running;
			that._powerupManager?.start();
			that._updateInterval = setInterval(function() {
				that.runLoop();
			}, GAME_CONSTANTS.TICK_RATE);
		}, this._startTime - Date.now());
	}

	public resumeGame(): void {
		this._logger.debug(`Resuming game ${this._id}`);
		clearInterval(this._abortTimeout);
		this.status = GameStatus.PreGame;
		this._startTime = Date.now() + GAME_CONSTANTS.PRE_GAME_COUNTDOWN;
		const initialGameState: InitialGameState = {
			player_id: 0,
			start_time: this._startTime
		}
		this._player1.user.socket.emit("initial_game_state", initialGameState);
		initialGameState.player_id = 1;
		this._player2.user.socket.emit("initial_game_state", initialGameState);
		const that = this;
		this._loopTimeout = setTimeout(function() {
			that.status = GameStatus.Running;
			that._powerupManager?.resume();
			that._updateInterval = setInterval(function() {
				that.runLoop();
			}, GAME_CONSTANTS.TICK_RATE);
		}, this._startTime - Date.now());
	}

	public endGame(): void {
		this._logger.debug(`Ending game ${this._id}`);
		this.clearTimeoutsIntervals();
		this.status = GameStatus.Finished;
		const winner = this._player1.score > this._player2.score ? this._player1 : this._player2;
		const loser = winner === this._player1 ? this._player2 : this._player1;
		winner.stats.onGameEnd(true);
		loser.stats.onGameEnd(false);
		this.broadcast("game_finished", {
			score: [this._player1.score, this._player2.score],
			winner: {
				id: winner.user.user_id,
				username: winner.user.username,
				avatar: winner.user.avatar,
			}
		});
		this.onGameFinished(this, winner);
	}

	public getGameState(): GameState {
		return {
			players: [
				{
					score: this._player1.score,
					position: this._player1.paddle.y,
					powerup: this._player1.powerup,
				},
				{
					score: this._player2.score,
					position: this._player2.paddle.y,
					powerup: this._player2.powerup,
				}
			],
			ball: {
				x: this._ball.x,
				y: this._ball.y
			},
			powerups: this._powerupsEnabled ? this._powerupManager.powerups
				.filter((powerup) => !powerup.activatedBy)
				.map((powerup) => {
					return {
						x: powerup.x,
						y: powerup.y,
						type: powerup.type,
					}
				}) : [],
		}
	}

	public async runLoop(): Promise<void> {
		if (this._status === GameStatus.Running) {
			this._powerupManager?.update();
			this.checkBallCollision();
			this.updateBallPosition();
			this.handlePaddleCollision(this._player1);
			this.handlePaddleCollision(this._player2);
			this.handlePowerupCollision();
			this.broadcast("game_state", this.getGameState());
		}
	}

	private broadcast(message: string, payload: any): void {
		if (this._player1.status === PlayerStatus.Ready) {
			this._player1.user.socket.emit(message, payload);
		}
		if (this._player2.status === PlayerStatus.Ready) {
			this._player2.user.socket.emit(message, payload);
		}
	}

	private determineGameResult(): void {
		const abort = () => {
			this._logger.log(`Game ${this._id} aborted due to insufficient player count.`);
			this.clearTimeoutsIntervals();
			this.status = GameStatus.Aborted;
			this.onGameFinished(this, null);
		};

		if (this._player1.score != this._player2.score && (this._player1.status === PlayerStatus.Ready || this._player2.status === PlayerStatus.Ready)) {
			const winningPlayer = this._player1.score > this._player2.score ? this._player1 : this._player2;
			if (winningPlayer.status === PlayerStatus.NotReady) {
				abort();
			} else {
				this.endGame();
			}
		} else {
			abort();
		}
	}

	private sendGameStatusUpdate(): void {
		this.broadcast("game_status_update", this._status);
	}

	private handlePowerupCollision(): void {
		if (!this._powerupsEnabled || !this._lastPaddleHitPlayer || this._lastPaddleHitPlayer.powerup) return;
		this._powerupManager.powerups.forEach((powerup, _) => {
			if (this._ball.x <= powerup.x + powerup.width &&
				this._ball.x + this._ball.width >= powerup.x &&
				this._ball.y <= powerup.y + powerup.height &&
				this._ball.y + this._ball.height >= powerup.y) {
					this._powerupManager.activePowerup(this._lastPaddleHitPlayer, powerup);
			}
		});
	}

	private handlePaddleCollision(player: Player): void {
		const paddle = player.paddle;
		if (
		  this._ball.x - this._ball.width <= paddle.x &&
		  this._ball.x >= paddle.x - paddle.width &&
		  this._ball.y <= paddle.y + paddle.height &&
		  this._ball.y + this._ball.height >= paddle.y
		) {
		  const hitPosition = (this._ball.y + this._ball.height / 2 - paddle.y) / paddle.height;

		  const hitAngle = hitPosition * GAME_CONSTANTS.PADDLE_HIT_ANGLE_RANGE - GAME_CONSTANTS.PADDLE_HIT_ANGLE_RANGE / 2;
		  const hitDirection = player === this._player1 ? 1 : -1;
		  const speed = Math.sqrt(this._ball.vx ** 2 + this._ball.vy ** 2);

		  this._ball.vx = speed * hitDirection * Math.cos(hitAngle) * GAME_CONSTANTS.BALL_SPEED_INCREASE_FACTOR;
		  this._ball.vy = speed * Math.sin(hitAngle) * GAME_CONSTANTS.BALL_SPEED_INCREASE_FACTOR;

		  this._ball.x = player === this._player1 ? paddle.x + this._ball.width : paddle.x - this._ball.width;

		  player.stats.onPaddleHit(hitPosition);

		  this._lastPaddleHitPlayer = player;
		}
	  }

	private updateScore(winner: Player) {
		if (winner == this.player1) {
			++this.player1.score;
			this.player2.stats.onPaddleMiss();
		}
		else {
			++this.player2.score;
			this.player1.stats.onPaddleMiss();
		}
		if (!this._ballHitWall) {
			winner.stats.onWallMiss();
		}
		this._ballHitWall = false;
		this.player1.stats.onScoreUpdate(this.player1.score, this.player2.score, winner == this.player1);
		this.player2.stats.onScoreUpdate(this.player2.score, this.player1.score, winner == this.player2);
		this._lastScoringPlayer = winner;
		this._lastScoredTimestamp = Date.now();
		this._lastPaddleHitPlayer = null;
		this._ball.vx = 0;
		this._ball.vy = 0;
		if (this._ball.x <= 0) {
			this._ball.x -= this._ball.width * 2;
		} else {
			this._ball.x += this._ball.width * 2;
		}
		if (this.player1.score >= GAME_CONSTANTS.SCORE_LIMIT || this.player2.score >= GAME_CONSTANTS.SCORE_LIMIT) {
			this.endGame();
		}
	}

	private updateBallPosition(): void {
		if (this._lastScoringPlayer && Date.now() - this._lastScoredTimestamp > GAME_CONSTANTS.SCORE_DELAY) {
			const side = this._lastScoringPlayer == this._player1 ? 1 : -1;
			const randomAngle = GAME_CONSTANTS.BALL_SPAWN_MIN_ANGLE + Math.random() * (GAME_CONSTANTS.BALL_SPAWN_MAX_ANGLE - GAME_CONSTANTS.BALL_SPAWN_MIN_ANGLE)
			this._ball.vx = GAME_CONSTANTS.BALL_INITIAL_SPEED * side * Math.cos(randomAngle);
			this._ball.vy = GAME_CONSTANTS.BALL_INITIAL_SPEED * Math.sin(randomAngle);
			this._ball.y = Math.floor(Math.random() * (GAME_CONSTANTS.ENGINE_RESOLUTION_HEIGHT - this._ball.height));
			this._ball.x = GAME_CONSTANTS.ENGINE_RESOLUTION_WIDTH / 2 - (GAME_CONSTANTS.ENGINE_RESOLUTION_HEIGHT * OFFSETS.BALL_HEIGHT_OFFSET / 2),
			this._lastScoringPlayer = null;
		} else {
			this._ball.x += this._ball.vx;
			this._ball.y += this._ball.vy;
			this._ball.y = Math.max(0, Math.min(GAME_CONSTANTS.ENGINE_RESOLUTION_HEIGHT - this._ball.height, this._ball.y));
		}
	}

	private checkBallCollision(): void {
		if (this._ball.x <= 0 && !this._lastScoringPlayer) {
			this.updateScore(this._player2);
		} else if (this._ball.x >= GAME_CONSTANTS.ENGINE_RESOLUTION_WIDTH - this._ball.width && !this._lastScoringPlayer) {
			this.updateScore(this._player1);
		} else {
			const collisionSide = this.detectWallCollision();
			if (collisionSide !== null) {
				this._ball.vy = -this._ball.vy * GAME_CONSTANTS.BALL_SPEED_DAMPEN_FACTOR;
				this._ballHitWall = true;
				this._lastPaddleHitPlayer?.stats.onWallBounce();
			}
		}
	}

	private detectWallCollision(): CollisionSide | null {
		if (this._ball.y <= 0) {
		  return CollisionSide.Top;
		} else if (this._ball.y >= GAME_CONSTANTS.ENGINE_RESOLUTION_HEIGHT - this._ball.height) {
		  return CollisionSide.Bottom;
		}
		return null;
	}

	private clearTimeoutsIntervals(): void {
		clearInterval(this._updateInterval);
		clearTimeout(this._loopTimeout);
		clearTimeout(this._abortTimeout);
	}

}

export enum PlayerStatus {
	NotReady,
	Ready,
}

export class Player {
	private _id: number;
	private _user: User;
	private _stats: PlayerStats;
	private _status: PlayerStatus;
	private _score: number;
	private _paddle: Paddle;
	private _hasDisconnectedOnce: boolean;
	private _powerup: PlayerPowerupState | null;

	constructor(user: User, stats: UserStats, isOnLeftSide: boolean) {
		this._id = isOnLeftSide ? 0 : 1;
		this._user = user;
		this._stats = new PlayerStats(stats);
		this._score = 0;
		this._paddle = new Paddle(isOnLeftSide);
		this._status = PlayerStatus.NotReady;
		this._hasDisconnectedOnce = false;
	}

	get id(): number {
		return this._id;
	}

	get user(): User {
		return this._user;
	}

	get stats(): PlayerStats {
		return this._stats;
	}

	get score(): number {
		return this._score;
	}

	get paddle(): Paddle {
		return this._paddle;
	}

	get status(): PlayerStatus {
		return this._status;
	}

	get powerup(): PlayerPowerupState | null {
		return this._powerup;
	}

	get hasDisconnectedOnce(): boolean {
		return this._hasDisconnectedOnce;
	}

	set score(score: number) {
		this._score = score;
	}

	set status(status: PlayerStatus) {
		this._status = status;
	}

	set user(user: User) {
		this._user = user;
	}

	set powerup(powerup: PlayerPowerupState | null) {
		this._powerup = powerup;
	}

	set hasDisconnectedOnce(hasDisconnectedOnce: boolean) {
		this._hasDisconnectedOnce = hasDisconnectedOnce;
	}
}

class Paddle {
	private _x: number;
	private _y: number;
	private _width: number;
	private _height: number;
	private _isPlayer1: boolean;
	private _speed: number;
	constructor(isPlayer1: boolean) {
		this._isPlayer1 = isPlayer1;
		this._width = GAME_CONSTANTS.ENGINE_RESOLUTION_WIDTH * OFFSETS.PADDLE_WIDTH_OFFSET;
		this._height = GAME_CONSTANTS.ENGINE_RESOLUTION_HEIGHT  * OFFSETS.PADDLE_HEIGHT_OFFSET;
		this._speed = GAME_CONSTANTS.PADDLE_SPEED;
		this.resetPosition();
	}

	public resetPosition() : void {
		if (this._isPlayer1) {
			this._x = 0;
		} else {
			this._x = GAME_CONSTANTS.ENGINE_RESOLUTION_WIDTH - this._width;
		}
		this._y =  GAME_CONSTANTS.ENGINE_RESOLUTION_HEIGHT / 2 - ( GAME_CONSTANTS.ENGINE_RESOLUTION_HEIGHT * OFFSETS.PADDLE_INITIAL_POS_OFFSET);
	}

	public moveUp() : void {
		this._y = Math.max(0, this._y - this._speed);
	}

	public moveDown() : void {
		this._y = Math.min(GAME_CONSTANTS.ENGINE_RESOLUTION_HEIGHT - this._height, this._y + this._speed);
	}

	get x(): number {
		return this._x;
	}

	get y(): number {
		return this._y;
	}

	get width(): number {
		return this._width;
	}

	get height(): number {
		return this._height;
	}

	set height(height: number) {
		this._height = height;
	}

	set speed(speed: number) {
		this._speed = speed;
	}
}

enum PowerUpType {
	SpeedBoost,
	PaddleExtension,
}

type PowerUp = {
	x: number;
	y: number;
	i_y: number;
	height: number;
	width: number;
	angle: number;
	type: PowerUpType;
	activatedBy: Player | null;
	durationExpiresAt: number | null;
}

class PowerUpManager {
	private _powerups: PowerUp[];
	private _maxPowerups: number;
	private _nextSpawnTimestamp: number;
	private _powerupDuration: number;
	private _pauseTimestamp: number;

	constructor() {
		this._powerups = [];
		this._maxPowerups = 5;
		this._powerupDuration = 10000;
	}

	public start() {
		this._nextSpawnTimestamp = Date.now() + this.randomBetween(6000, 10000);
	}

	public pause() {
		this._pauseTimestamp = Date.now();
	}

	public resume() {
		const timeDiff = Date.now() - this._pauseTimestamp;
		this._nextSpawnTimestamp += timeDiff;
		this._powerups.forEach((powerup) => {
			if (powerup.activatedBy) {
				powerup.durationExpiresAt += timeDiff;
			}
		});
	}

	public update(): void {
		let hasNonPickedPowerup = false;
		this._powerups.forEach((_, index) => {
			const powerup = this._powerups[index];
			// Check if powerup duration has expired
			if (powerup.activatedBy && Date.now() > powerup.durationExpiresAt) {
				this.deactivatePowerup(powerup);
				this._powerups.splice(index, 1);
			} else if (!powerup.activatedBy) {
				hasNonPickedPowerup = true;
				// make the powerup float
				powerup.y = powerup.i_y + GAME_CONSTANTS.POWERUP_FLOATING_AMPLITUDE * Math.sin(powerup.angle);
				powerup.angle += GAME_CONSTANTS.POWERUP_FLOATING_FREQUENCY;
			}
		});
		if (!hasNonPickedPowerup && this._powerups.length < this._maxPowerups && Date.now() > this._nextSpawnTimestamp) {
			this.spawnPowerUp();
			this._nextSpawnTimestamp = Date.now() + this.randomBetween(11000, 20000);
		}
	}

	public activePowerup(player: Player, powerup: PowerUp): void {
		if (powerup.activatedBy) {
			return;
		}
		powerup.activatedBy = player;
		powerup.durationExpiresAt = Date.now() + this._powerupDuration;
		player.powerup = {
			type: powerup.type,
			expiresAt: powerup.durationExpiresAt,
		}
		if (powerup.type === PowerUpType.SpeedBoost) {
			player.paddle.speed = GAME_CONSTANTS.PADDLE_SPEED * 1.5;
		} else if (powerup.type === PowerUpType.PaddleExtension) {
			player.paddle.height = GAME_CONSTANTS.ENGINE_RESOLUTION_HEIGHT  * (OFFSETS.PADDLE_HEIGHT_OFFSET * 2);
		}
	}

	public deactivatePowerup(powerup: PowerUp): void {
		if (powerup.type === PowerUpType.SpeedBoost) {
			powerup.activatedBy.paddle.speed = GAME_CONSTANTS.PADDLE_SPEED;
		} else if (powerup.type === PowerUpType.PaddleExtension) {
			powerup.activatedBy.paddle.height = GAME_CONSTANTS.ENGINE_RESOLUTION_HEIGHT * OFFSETS.PADDLE_HEIGHT_OFFSET;
		}
		powerup.activatedBy.powerup = null;
		powerup.activatedBy = null;
	}

	public get powerups(): PowerUp[] {
		return this._powerups;
	}

	private spawnPowerUp(): void {
		const y = this.randomBetween(GAME_CONSTANTS.ENGINE_RESOLUTION_HEIGHT * 0.1, GAME_CONSTANTS.ENGINE_RESOLUTION_HEIGHT * 0.9);
		const powerUp: PowerUp = {
			x: this.randomBetween(GAME_CONSTANTS.ENGINE_RESOLUTION_WIDTH * 0.3, GAME_CONSTANTS.ENGINE_RESOLUTION_WIDTH * 0.7),
			y: this.randomBetween(GAME_CONSTANTS.ENGINE_RESOLUTION_HEIGHT * 0.1, GAME_CONSTANTS.ENGINE_RESOLUTION_HEIGHT * 0.9),
			i_y: y,
			angle: 0,
			type: Math.random() > 0.5 ? PowerUpType.SpeedBoost : PowerUpType.PaddleExtension,
			height: GAME_CONSTANTS.ENGINE_RESOLUTION_HEIGHT * OFFSETS.POWERUP_HEIGHT_OFFSET,
			width: GAME_CONSTANTS.ENGINE_RESOLUTION_HEIGHT * OFFSETS.POWERUP_WIDTH_OFFSET,
			activatedBy: null,
			durationExpiresAt: null,
		}
		this._powerups.push(powerUp);
	}

	private randomBetween(min: number, max: number): number {
		return Math.floor(Math.random() * (max - min + 1) + min);
	}
}
