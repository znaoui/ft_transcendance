import { Player } from "./game.class";
import { GAME_CONSTANTS } from "./game.constants";

export interface GameAchievement {
	id: string;
	name: string;
	description: string;
	icon: string;
	conditionMet: (stats: Player, opponent_stats: Player) => boolean;
}

const sharpshooter: GameAchievement = {
	id: 'sharpshooter',
	name: 'Sharpshooter',
	description: 'Win a game without missing a single shot',
	icon: '/assets/achievements/sharpshooter.webp',
	conditionMet: (p: Player, o: Player) => p.stats.wonCurrentGame && p.stats.paddleMisses === 0
};

const fiveStarFinisher: GameAchievement = {
	id: 'five-star-finisher',
	name: 'Five Star Finisher',
	description: 'Score 5 points in a row and win the game',
	icon: '/assets/achievements/five-star-finisher.webp',
	conditionMet: (p: Player, o: Player) => p.stats.wonCurrentGame && p.stats.largestScoreStreak >= GAME_CONSTANTS.SCORE_LIMIT
};

const lighningReflexes: GameAchievement = {
	id: 'lightning-reflexes',
	name: 'Lightning Reflexes',
	description: 'Win a game under 1 minute',
	icon: '/assets/achievements/lightning-reflexes.webp',
	conditionMet: (p: Player, o: Player) => p.stats.wonCurrentGame && p.stats.gameDurationSeconds < 60
};

const comebackKid: GameAchievement = {
	id: 'comeback-kid',
	name: 'Comeback Kid',
	description: 'Win a game after being down by at least 3 points',
	icon: '/assets/achievements/comeback-kid.webp',
	conditionMet: (p: Player, o: Player) => p.stats.wonCurrentGame && p.stats.largestScoreDifference <= -3
};

const wallBouncer: GameAchievement = {
	id: 'wall-bouncer',
	name: 'Wall Bouncer',
	description: 'Bounce the ball off the wall 5 times in a row',
	icon: '/assets/achievements/wall-bouncer.webp',
	conditionMet: (p: Player, o: Player) => p.stats.largestWallBounceStreak >= 5
};

const paddleMaster: GameAchievement = {
	id: 'paddle-master',
	name: 'Paddle Master',
	description: 'Hit the paddle 10 times in a row',
	icon: '/assets/achievements/paddle-master.webp',
	conditionMet: (p: Player, o: Player) => p.stats.largestPaddleHitStreak >= 10
};

const stalemateBreaker: GameAchievement = {
	id: 'stalemate-breaker',
	name: 'Stalemate Breaker',
	description: 'Win a game after reaching a 4-4 tie',
	icon: '/assets/achievements/stalemate-breaker.webp',
	conditionMet: (p: Player, o: Player) => p.stats.wonCurrentGame && o.score === 4
};

const firstWin: GameAchievement = {
	id: 'first-win',
	name: 'First Win',
	description: 'Win your first game',
	icon: '/assets/achievements/first-win.webp',
	conditionMet: (p: Player, o: Player) => p.stats.wonCurrentGame && p.stats.gamesWon === 1
};

const hatTrick: GameAchievement = {
	id: 'hat-trick',
	name: 'Hat Trick',
	description: 'Win 3 games in a row',
	icon: '/assets/achievements/hat-trick.webp',
	conditionMet: (p: Player, o: Player) => p.stats.wonCurrentGame && p.stats.gameWinsStreak === 3
};

const topGun: GameAchievement = {
	id: 'top-paddle-hits',
	name: 'Top Gun',
	description: 'Win a game hitting the ball with the top of the paddle only',
	icon: '/assets/achievements/top-paddle-hits.webp',
	conditionMet: (p: Player, o: Player) => p.stats.wonCurrentGame && p.stats.topPaddleHits === p.stats.paddleHits
};

const bottomFeeder: GameAchievement = {
	id: 'bottom-paddle-hits',
	name: 'Low Sweep Master',
	description: 'Win a game hitting the ball with the bottom of the paddle only',
	icon: '/assets/achievements/bottom-paddle-hits.webp',
	conditionMet: (p: Player, o: Player) => p.stats.wonCurrentGame && p.stats.bottomPaddleHits === p.stats.paddleHits
};

const wallHugger: GameAchievement = {
	id: 'wall-hugger',
	name: 'Wall Hugger',
	description: 'Win a game without hitting the wall once',
	icon: '/assets/achievements/wall-hugger.webp',
	conditionMet: (p: Player, o: Player) => p.stats.wonCurrentGame && p.stats.wallBounces === 0
};

const doubleBounce: GameAchievement = {
	id: 'double-bounce',
	name: 'Double Bounce',
	description: 'Make the ball bounce 2 times in a row',
	icon: '/assets/achievements/double-bounce.webp',
	conditionMet: (p: Player, o: Player) => p.stats.largestWallBounceStreak >= 2
};

const pointPioneer: GameAchievement = {
	id: 'point-pioneer',
	name: 'Point Pioneer',
	description: 'Score your first point',
	icon: '/assets/achievements/point-pioneer.webp',
	conditionMet: (p: Player, o: Player) => p.stats.totalPointsScored >= 1
};

const firstGame: GameAchievement = {
	id: 'first-game',
	name: 'First Game',
	description: 'Play your first game',
	icon: '/assets/achievements/first-game.webp',
	conditionMet: (p: Player, o: Player) => p.stats.gamesPlayed === 1
};

const quintupleTriomphe: GameAchievement = {
	id: 'quintuple-triumph',
	name: 'Quintuple Triumph',
	description: 'Win 5 games',
	icon: '/assets/achievements/quintuple-triumph.webp',
	conditionMet: (p: Player, o: Player) => p.stats.wonCurrentGame && p.stats.gamesWon === 5
};

const rageQuit: GameAchievement = {
	id: 'rage-quit',
	name: 'Rage Quit',
	description: 'Win by making your opponent rage quit before the game ends',
	icon: '/assets/achievements/rage-quit.webp',
	conditionMet: (p: Player, o: Player) => p.stats.wonCurrentGame && p.score < GAME_CONSTANTS.SCORE_LIMIT,
};

const awayFromKeyboard: GameAchievement = {
	id: 'away-from-keyboard',
	name: 'Away From Keyboard',
	description: 'Win a game without hitting the ball once',
	icon: '/assets/achievements/away-from-keyboard.webp',
	conditionMet: (p: Player, o: Player) => p.stats.wonCurrentGame && p.stats.paddleHits === 0,
};

export const GameAchievements: GameAchievement[] = [
	sharpshooter,
	lighningReflexes,
	comebackKid,
	wallBouncer,
	paddleMaster,
	stalemateBreaker,
	hatTrick,
	firstWin,
	topGun,
	bottomFeeder,
	wallHugger,
	doubleBounce,
	pointPioneer,
	firstGame,
	quintupleTriomphe,
	rageQuit,
	awayFromKeyboard,
	fiveStarFinisher,
];
