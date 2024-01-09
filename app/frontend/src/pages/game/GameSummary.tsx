import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getGameSummary } from '../../api/games';
import { GameSummary, UnlockedAchievement } from './models/GameSummary';

type GameSummaryProps = {
	gameSummary: GameSummary
}

type StatCardProps = {
	title: string,
	player1_value: number,
	player2_value: number,
}

function StatCard({title, player1_value, player2_value}: StatCardProps) {
	const p1_color = player1_value > player2_value ? 'text-red-400' : 'text-white';
	const p2_color = player2_value > player1_value ? 'text-red-400' : 'text-white';
	return (
		<div className="w-72 p-2 border rounded-lg shadow bg-gray-800 border-gray-700">
			<div className="flex justify-between items-center">
				<span className={`text-l font-medium ${p1_color}`}>{player1_value}</span>
				<div className="text-m font-medium text-white">{title}</div>
				<span className={`text-l font-medium ${p2_color}`}>{player2_value}</span>
			</div>
		</div>
	)
}

function AchievementCard({name, description, icon}: UnlockedAchievement) {
	return (
		<div className="w-72 p-2 border rounded-lg shadow bg-gray-800 border-gray-700">
			<div className="flex items-start">
				<img src={icon} className="w-12 h-12 rounded-full" alt={name} />
				<div className="ml-4">
					<div className="text-l font-medium text-white">{name}</div>
					<div className="text-sm font-medium text-gray-400">{description}</div>
				</div>
			</div>
		</div>
	)
}

function GameSummaryComponent({gameSummary}: GameSummaryProps) {
	const navigate = useNavigate();
	return (
		<div className='flex flex-col items-center justify-center space-y-7 p-2'>
			<div className='flex justify-between space-x-10'>
				<div className='flex flex-col'>
					<img src={gameSummary.player1.avatar} className='w-20 h-20 rounded-full' alt="Avatar" />
					<div className='text-center'>{gameSummary.player1.username}</div>
				</div>
				<div className="text-6xl text-white">vs</div>
				<div className='flex flex-col'>
					<img src={gameSummary.player2.avatar} className='w-20 h-20 rounded-full' alt="Avatar" />
					<div className='text-center'>{gameSummary.player2.username}</div>
				</div>
			</div>
			<button className='w-48 p-1 border rounded-lg shadow bg-gray-600 border-gray-700 hover:bg-gray-500' onClick={() => navigate('/')}>Next</button>
			<div className='flex flex-col items-center justify-center space-y-1'>
				<div className="relative flex items-center w-full mb-2">
					<div className="flex-grow border-t border-gray-400"></div>
					<span className="flex-shrink mx-4 text-gray-400">Statistics</span>
					<div className="flex-grow border-t border-gray-400"></div>
				</div>
				<StatCard title='Score' player1_value={gameSummary.score[0]} player2_value={gameSummary.score[1]} />
				<StatCard title='Largest Score Streak' player1_value={gameSummary.player1.largest_score_streak} player2_value={gameSummary.player2.largest_score_streak} />
				<StatCard title='Paddle Hits' player1_value={gameSummary.player1.paddle_hits} player2_value={gameSummary.player2.paddle_hits} />
				<StatCard title='Wall Hits' player1_value={gameSummary.player1.wall_hits} player2_value={gameSummary.player2.wall_hits} />
				<StatCard title='Top Paddle Hits' player1_value={gameSummary.player1.top_paddle_hits} player2_value={gameSummary.player2.top_paddle_hits} />
				<StatCard title='Bottom Paddle Hits' player1_value={gameSummary.player1.bottom_paddle_hits} player2_value={gameSummary.player2.bottom_paddle_hits} />
			</div>
			{gameSummary.unlocked_achievements.length > 0 &&
				<div className='flex flex-col items-center justify-center space-y-1'>
					<div className="relative flex items-center w-full">
						<div className="flex-grow border-t border-gray-400"></div>
						<span className="flex-shrink mx-4 text-gray-400">Achievements</span>
						<div className="flex-grow border-t border-gray-400"></div>
					</div>
					{gameSummary.unlocked_achievements.map((achievement, index) => {
						return <AchievementCard key={index} {...achievement} />
					})}
			</div>}
		</div>
	)
}

function LoadingComponent() {
	return (
	  <div className="flex flex-col items-center justify-center h-screen">
			<div
			className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"
			role="status">
			<span
			className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">Loading...</span>
			</div>
		</div>
	)
}

export function GameSummaryPage() {
	const [gameSummary, setGameSummary] = useState<GameSummary | null>(null);

	const location = useLocation();
	const navigate = useNavigate();

	React.useEffect(() => {
		if (!location.state) {
			navigate('/');
			return;
		}
		const game_id = location.state;
		getGameSummary(game_id).then(gameSummary => {
			setGameSummary(gameSummary);
		});
	}, []);

	return (
		!gameSummary ? <LoadingComponent /> : <GameSummaryComponent gameSummary={gameSummary} />
	)
}
