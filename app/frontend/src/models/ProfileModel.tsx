export interface Profile{
	id: number,
	username: string,
	avatar: string,
	stats: Stats
}

export interface Stats{
	rank : number,
	games_played: number,
	games_won: number,
	games_lost: number,
	win_streak: number,
	total_points_scored: number,
	total_paddle_hits: number,
	total_play_time_seconds: number,
	history: History[],
	achievements: Achievement[],
	joined_at: string
}

export interface History{
	date: number
	id: number,
	winner_id: number,
	player1: Player,
	player2: Player
}

export interface Player{
	id: number,
	username: string,
	avatar: string,
	score: number

}

export interface Achievement{
	id : string,
	name : string,
	description: string,
	icon: string
}