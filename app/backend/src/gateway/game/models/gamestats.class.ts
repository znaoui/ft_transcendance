import { UserStats } from "src/api/users/entities/userstats.entity";

export class PlayerStats {
	private _gameWinsStreak: number;
	private _gamesPlayed: number;
	private _gamesWon: number;
	private _gamesLost: number;
	private _totalPaddleHits: number;
	private _totalPointsScored: number;
	private _totalPlayTimeSeconds: number;

	private _paddleHits: number;
	private _paddleMisses: number;
	private _paddleHitStreak: number;
	private _largestPaddleHitStreak: number;
	private _scoreStreak: number;
	private _largestScoreStreak: number;
	private _largestScoreDifference: number;
	private _wallBounces: number;
	private _wallBounceStreak: number;
	private _largestWallBounceStreak: number;
	private _topPaddleHits: number;
	private _bottomPaddleHits: number;
	private _gameStartTime: number;
	private _gameDurationSeconds: number;
	private _wonCurrentGame: boolean;

	constructor(userStats: UserStats) {
		this._paddleHits = 0;
		this._paddleMisses = 0;
		this._paddleHitStreak = 0;
		this._largestPaddleHitStreak = 0;
		this._scoreStreak = 0;
		this._largestScoreStreak = 0;
		this._largestScoreDifference = 0;
		this._wallBounces = 0;
		this._wallBounceStreak = 0;
		this._largestWallBounceStreak = 0;
		this._topPaddleHits = 0;
		this._bottomPaddleHits = 0;
		this._gameDurationSeconds = 0;
		this._wonCurrentGame = false;
		this._gameWinsStreak = userStats.win_streak;
		this._gamesPlayed = userStats.games_played;
		this._gamesWon = userStats.games_won;
		this._gamesLost = userStats.games_lost;
		this._totalPaddleHits = userStats.total_paddle_hits;
		this._totalPointsScored = userStats.total_points_scored;
		this._totalPlayTimeSeconds = userStats.total_play_time_seconds;
	}

	public get gamesPlayed(): number {
		return this._gamesPlayed;
	}

	public get gamesWon(): number {
		return this._gamesWon;
	}

	public get totalPaddleHits(): number {
		return this._totalPaddleHits;
	}

	public get totalPointsScored(): number {
		return this._totalPointsScored;
	}

	public get paddleHits(): number {
		return this._paddleHits;
	}

	public get paddleMisses(): number {
		return this._paddleMisses;
	}

	public get paddleHitStreak(): number {
		return this._paddleHitStreak;
	}

	public get largestPaddleHitStreak(): number {
		return this._largestPaddleHitStreak;
	}

	public get scoreStreak(): number {
		return this._scoreStreak;
	}

	public get largestScoreStreak(): number {
		return this._largestScoreStreak;
	}

	public get largestScoreDifference(): number {
		return this._largestScoreDifference;
	}

	public get wallBounces(): number {
		return this._wallBounces;
	}

	public get wallBounceStreak(): number {
		return this._wallBounceStreak;
	}

	public get largestWallBounceStreak(): number {
		return this._largestWallBounceStreak;
	}

	public get topPaddleHits(): number {
		return this._topPaddleHits;
	}

	public get bottomPaddleHits(): number {
		return this._bottomPaddleHits;
	}

	public get gameDurationSeconds(): number {
		return this._gameDurationSeconds;
	}

	public get gameWinsStreak(): number {
		return this._gameWinsStreak;
	}

	public get totalPlayTimeSeconds(): number {
		return this._totalPlayTimeSeconds;
	}

	public get wonCurrentGame(): boolean {
		return this._wonCurrentGame;
	}

	public get gamesLost(): number {
		return this._gamesLost;
	}

	public onGameStart(): void {
		this._gameStartTime = Date.now();
	}

	public onPaddleHit(hitPosition: number): void {
		this._paddleHits++;
		this._paddleHitStreak++;
		this._totalPaddleHits++;
		if (this._paddleHitStreak > this._largestPaddleHitStreak) {
			this._largestPaddleHitStreak = this._paddleHitStreak;
		}
		if (hitPosition < 0.25) {
			this._topPaddleHits++;
		} else if (hitPosition > 0.75) {
			this._bottomPaddleHits++;
		}
	}

	public onPaddleMiss(): void {
		this._paddleMisses++;
		this._paddleHitStreak = 0;
	}

	public onWallBounce(): void {
		this._wallBounces++;
		this._wallBounceStreak++;
		if (this._wallBounceStreak > this._largestWallBounceStreak) {
			this._largestWallBounceStreak = this._wallBounceStreak;
		}
	}

	public onWallMiss(): void {
		this._wallBounceStreak = 0;
	}

	public onScoreUpdate(me: number, opponent: number, playerScored: boolean): void {
		if (playerScored) {
			this._totalPointsScored++;
		}
		const scoreDifference = Math.abs(me - opponent);
		if (scoreDifference > Math.abs(this._largestScoreDifference)) {
			this._largestScoreDifference = me - opponent;
		}
		if (playerScored) {
			this._scoreStreak++;
			if (this._scoreStreak > this._largestScoreStreak) {
				this._largestScoreStreak = this._scoreStreak;
			}
		} else {
			this._scoreStreak = 0;
		}
	}

	public onGameEnd(hasWon: boolean): void {
		this._gameDurationSeconds = Math.round((Date.now() - this._gameStartTime) / 1000);
		this._totalPlayTimeSeconds += this._gameDurationSeconds;
		if (hasWon) {
			this._gameWinsStreak++;
		} else {
			this._gameWinsStreak = 0;
		}
		this._gamesPlayed++;
		if (hasWon) {
			this._wonCurrentGame = true;
			this._gamesWon++;
		} else {
			this._wonCurrentGame = false;
			this._gamesLost++;
		}
	}
}
