import React, { useState } from 'react';
import { leaderboardInfo } from '../../api/games';
import { useEffect } from 'react';
import { LadderModel } from '../../models/Ladder';

function Leaderboard(){

	const [players, setData] = useState<LadderModel[]>([]);

	useEffect(() =>{
		getLadder()
	}, [])

	async function getLadder(){
		const varw = await leaderboardInfo()
		setData(varw)
	}

	return(
		<table className="w-full divide-y divide-gray-200 border  shadow-lg bg-gray-700">
			<thead className="bg-gray-500">
				<tr className="flex flex-row justify-between">
				<th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
					Rank
				</th>
				<th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
					Name
				</th>
				<th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
					Score
				</th>
				</tr>
			</thead>
			<tbody className="w-full bg-gray-700">
				{players.map((player, index) => (
					<tr key={index} className="flex flex-row w-full h-14 border-b">
						<td className="text-white w-5/12 flex items-center justify-start ml-6">{index + 1}</td>
						<td className="text-white flex flex-row gap-2 items-center w-5/12">
							<img className="w-8 h-8 rounded-full" src={player.avatar} alt={player.username} />
							<span className="text-yellow-400">{player.username}</span>
						</td>
						<td className="text-yellow-400 w-2/12 text-right mr-6 flex items-center justify-end">{(player.total_wins + player.total_points) * 100}</td>
					</tr>
				))}
			</tbody>
		</table>

	)

}
export default Leaderboard;
