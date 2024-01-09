import { GameSummary } from "../pages/game/models/GameSummary";
import { LadderModel } from "../models/Ladder";

const getGameSummary = async (id: number) => {
	const response = await fetch(`/api/games/${id}/summary`);
	if (!response.ok) {
		throw new Error(`Could not get game: ${response.status}`);
	}
	const gameSummary: GameSummary = await response.json();
	return gameSummary;
}

const inviteUser = async(user_id: number) => {
	const response = await fetch(`/api/games/invite`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json"
		},
		body: JSON.stringify({ user_id })
	});
	const json = await response.json();
	return json;
}

const leaderboardInfo = async() =>{
	const response = await fetch(`/api/games/leaderboard`)
	const ladder = Array<LadderModel>()
	const json = await response.json();
	for (let i = 0; i < json.length; i++){
		ladder.push({
			id : json[i].id,
			username : json[i].username,
			avatar : json[i].avatar,
			total_wins : json[i].total_wins,
			total_points : json[i].total_points_scored,
			total_playtime : json[i].total_play_time_seconds,
		})
	}

	return ladder;
}

export { getGameSummary, inviteUser, leaderboardInfo };
