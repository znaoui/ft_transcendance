import React from 'react';
import { gameSocket } from '../../../sockets/game';
import useSocketEvents from '../../../sockets/useSocketsEvents';
import { MatchFoundPayload, MatchmakingResponse, MatchmakingType } from './models/matchmaking';
import { useNavigate } from 'react-router-dom';
import { useUserContext } from '../../../UserContext';
import Leaderboard from '../LeaderBoard';
import { toast } from 'react-hot-toast';

type MatchMakingModalProps = {
	type: MatchmakingType,
	closeModal: () => void;
}

function MatchMakingModal({ type, closeModal }: MatchMakingModalProps) {
	React.useEffect(() => {
		if (!gameSocket.connected) {
			gameSocket.connect();
		} else {
			handleConnect();
		}
	}, []);

	const handleConnect = async () => {
		const response: MatchmakingResponse = await gameSocket.emitWithAck('join_matchmaking', type);
		if (!response.success) {
			toast.error(response.error!)
			closeModal();
		}
	}
	const handleConnectError = () => {
		toast.error('There was an error connecting to the server');
		closeModal();
	}
	useSocketEvents(gameSocket, [
		{ event: 'connect', handler: handleConnect },
		{ event: 'connect_error', handler: handleConnectError },
	]);

	const onModalClose = () => {
		gameSocket.emit('leave_matchmaking');
		closeModal();
	}

	return (
		<div className="fixed z-10 inset-0 overflow-y-auto">
			<div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
				<div className="fixed inset-0 transition-opacity" aria-hidden="true">
					<div className="absolute inset-0 bg-gray-500 opacity-75"></div>
				</div>
				<span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
				<div className="inline-block align-bottom rounded-lg text-center items-center overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
					<div className="bg-gray-700 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
						<div className="sm:flex sm:items-start">
							<div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
								<h3 className="text-lg leading-6 font-medium text-white" id="modal-title">
									Matchmaking
								</h3>
								<div className="mt-2 flex items-center">
										<svg aria-hidden="true" className="inline w-5 h-5 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
											<path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
											<path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/>
										</svg>
									<p className="text-sm text-gray-200 ml-3">
										Searching for a match...
									</p>
								</div>
							</div>
						</div>
					</div>
						<div className="bg-gray-600 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
							<button type="button" onClick={onModalClose} className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-400 text-base font-medium text-white hover:bg-red-600 sm:ml-3 sm:w-auto sm:text-sm">
								Cancel
							</button>
						</div>
				</div>
			</div>
		</div>
	);
}

type UnfinishedGameCardProps = {
	data: MatchFoundPayload;
	onTimeout: () => void;
}

function UnfinishedGameCard({ data, onTimeout }: UnfinishedGameCardProps) {
	const [seconds, setSeconds] = React.useState(Math.floor((data.timeout - Date.now()) / 1000));
	const { user } = useUserContext();
	const navigate = useNavigate();

	const joinGame = () => {
		navigate('/game', { state: data });
	}

	React.useEffect(() => {
		const interval = setInterval(() => {
			if (seconds - 1 <= 0) {
				clearInterval(interval);
				onTimeout();
			} else {
				setSeconds(seconds - 1);
			}
		}, 1000);
		return () => clearInterval(interval);
	}, []);

	return (
		<div className="flex flex-col justify-center items-center h-full">
			<div className="w-96 p-4 border rounded-lg shadow bg-gray-800 border-gray-700">
				<h2 className="font-bold mb-4 text-center">You have an unfinished game!</h2>
				<div className="flex items-start">
					<img src={data.opponent.avatar} className="w-12 h-12 rounded-full" alt="Avatar" />
					<div className="ml-4 space-y-3">
						<div className="text-l font-medium text-white">{data.opponent.username} vs {user?.username}</div>
						<div className="text-sm italic text-gray-400">You have {seconds}s left to join the game back.</div>
						<button onClick={joinGame} className="text-sm bg-gray-700 border-gray-600 border rounded-md p-2 text-red-400 hover:bg-gray-600">Join Game</button>
					</div>
				</div>
			</div>
		</div>
	)
}


function MainContent() {
	const [unfinishedGame, setUnfinishedGame] = React.useState<MatchFoundPayload | null>(null);
	const [matchmakingType, setMatchmakingType] = React.useState<MatchmakingType | null>(null);

	const handleUnfinishedGame = (data: MatchFoundPayload) => {
		setUnfinishedGame(data);
	};

	const onUnfinishedGameTimeout = () => {
		setUnfinishedGame(null);
	};

	useSocketEvents(gameSocket, [
		{ event: 'unfinished_game', handler: handleUnfinishedGame },
	]);

	if (matchmakingType != null) {
		return (
			<MatchMakingModal type={matchmakingType} closeModal={() => setMatchmakingType(null)} />
		);
	}

	return (
		<div className="h-full">
			{unfinishedGame ?  (
				<UnfinishedGameCard data={unfinishedGame} onTimeout={onUnfinishedGameTimeout} />
			): (
				<div className='flex flex-col items-center h-4/5 mt-20 justify-around'>
					<div className='w-2/3 h-4/5 flex item-center overflow-y-auto'>
						<Leaderboard />
					</div>
					<div className="flex flex-row justify-center items-center w-full gap-4">
						<button onClick={() => setMatchmakingType(MatchmakingType.CLASSIC)} className="block w-1/4 mb-4 bg-white text-black py-2 px-4 rounded">Search Game (Classic)</button>
						<button onClick={() => setMatchmakingType(MatchmakingType.POWERUPS)} className="block w-1/4 mb-4 bg-white text-black py-2 px-4 rounded">Search Game (Powerups)</button>
					</div>
				</div>
			)}
		</div>
	);
}

export default MainContent;
