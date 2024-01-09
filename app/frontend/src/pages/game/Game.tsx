import React from 'react';
import { gameSocket } from '../../sockets/game';
import { engineState } from './EngineState';
import { cleanGame, initGame } from './Engine';
import useSocketEvents from '../../sockets/useSocketsEvents';
import { useLocation, useNavigate } from 'react-router-dom';
import { GameState, GameStatus } from './GameState';
import { MatchFoundPayload } from '../dashboard/maincontent/models/matchmaking';
import { useUserContext } from '../../UserContext';
import { GameFinishedPayload, GamePausedPayload, InitialGameState } from './models/GamePayloads';

type GamePageProps = {
	match: MatchFoundPayload;
}

function BasicModal({title, message}: {title: string, message: string}) {
	return (
		<div className="fixed inset-0 flex items-center justify-center z-50">
			<div
			className="fixed inset-0 bg-black opacity-50"></div>
			<div className="bg-gray-700 p-4 rounded-md w-96 z-10 text-center opacity-80">
			<h2 className="text-white font-semibold mb-4">{title}</h2>
			<div className="text-center text-m">
				{message}
			</div>
			</div>
		</div>
	)
}

function ErrorModal({title, message}: {title: string, message: string}) {
	const navigate = useNavigate();
	return (
		<div className="fixed inset-0 flex items-center justify-center z-50">
			<div
			className="fixed inset-0 bg-black opacity-50"></div>
			<div className="bg-gray-700 p-4 rounded-md w-96 z-10 text-center opacity-80">
			<h2 className="text-white font-semibold mb-4">{title}</h2>
			<div className="flex-col">
				<div className="text-center text-m">
					{message}
				</div>
				<div className="flex justify-center mt-4">
					<button className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded" onClick={() => navigate("/")}>Dashboard</button>
				</div>
			</div>
			</div>
		</div>
	)
}

function GameCountDownModal({seconds}: {seconds: number}) {
	const { user } = useUserContext();
	const player1 = engineState.game.my_player_id === 0 ? user : engineState.game.info?.opponent;
	const player2 = player1 === user ? engineState.game.info?.opponent : user;

	return (
		<div className="fixed inset-0 flex items-center justify-center z-50">
			<div
			className="fixed inset-0 bg-black opacity-50"></div>
			<div className="bg-gray-700 p-4 rounded-md w-96 z-10 text-center opacity-80">
				<h2 className="text-white font-semibold mb-4">Game starting in {seconds}</h2>
				<div className="flex justify-between">
					<div className="flex-col items-center">
						<img src={player1!.avatar} alt={player1!.username} className="w-24 h-24 rounded-full" />
						<div>{player1!.username}</div>
					</div>
					<div className="text-6xl text-white">vs</div>
					<div className="flex-col items-center">
						<img src={player2!.avatar} alt={player2!.username} className="w-24 h-24 rounded-full" />
						<div>{player2!.username}</div>
					</div>
				</div>
			</div>
		</div>
	)
}

function GameFinishModal ({payload}: {payload: GameFinishedPayload}) {
	const navigate = useNavigate();

	React.useEffect(() => {
		const game_id = engineState.game.info!.game_id;
		setTimeout(() => {
			navigate('/game/summary', {state: game_id})
		}, 5000);
	}, []);
	return (
		<div className="fixed inset-0 flex items-center justify-center z-50">
			<div className="fixed inset-0 bg-black opacity-50"></div>
			<div className="bg-gray-700 p-4 rounded-md w-96 z-10 text-center opacity-80">
				<h2 className="text-white font-semibold mb-4">{payload.winner.username} has won the game!</h2>
				<div className="flex flex-col justify-center items-center">
					<img src={payload.winner.avatar} alt={payload.winner.username} className="w-24 h-24 rounded-full" />
					<div className="text-xl mt-2" >{payload.score[0]} - {payload.score[1]}</div>
				</div>
				<div className="justify-center mt-4">
					<span className="text-white text-xs">You will be redirected to the game summary in 5 seconds...</span>
				</div>
			</div>
		</div>
	);
}

function DrawGame({match}: GamePageProps) {
	const canvasRef = React.useRef<HTMLCanvasElement>(null);
	const [modalState, setModalState] = React.useState({title: '', message: ''});
	const [countDown, setCountDown] = React.useState(0);
	const [errorState, setErrorState] = React.useState({title: '', message: ''});
	const [finishPayload, setFinishPayload] = React.useState<GameFinishedPayload | null>(null);
	const location = useLocation();

	React.useLayoutEffect(() => {
		engineState.canvasRef = canvasRef;
		engineState.game.info = match;

		setModalState({title: 'Loading game', message: 'Connecting to server...'});

		if (!gameSocket.connected) {
			gameSocket.connect();
		} else {
			handleConnection();
		}

		initGame();
	}, []);

	React.useEffect(() => {
		return () => {
			cleanGame();
		}
	}, []);

	const handleConnection = async () => {
		if (!engineState.game.info || location.pathname !== '/game') return;

		engineState.game.status = GameStatus.Waiting;

		const interval = setInterval(function() {
			if (engineState.game.status !== GameStatus.Waiting) {
				clearInterval(interval);
			} else if (engineState?.game?.info) {
				let timeout_seconds = Math.floor((engineState.game.info!.timeout - Date.now())/ 1000);
				if (--timeout_seconds > 0) {
					setModalState({title: 'Waiting for players to join the game...', message: timeout_seconds.toString()});
				} else {
					clearInterval(interval);
				}
			}
		}, 1000);

		const result = await gameSocket.emitWithAck('join_game', engineState.game.info?.game_id);
		if (!result.success) {
			setErrorState({title: 'Error', message: result.error});
			clearInterval(interval);
		}
	}

	const handleConnectionError = () => {
		setErrorState({title: 'Error', message: 'Could not connect to the server'});
	}

	const handleDisconnect = () => {
		setErrorState({title: 'Error', message: 'You have been disconnected from the server'});
	}

	const handleInitialGameState = (data: InitialGameState) => {
		engineState.game.my_player_id = data.player_id;
		engineState.game.last_server_update = Date.now();
		engineState.game.status = GameStatus.PreGame;
		setModalState({title: '', message: ''})
		const interval = setInterval(function() {
			if (engineState.game.status !== GameStatus.PreGame) {
				clearInterval(interval);
				setCountDown(0);
				return;
			}
			let seconds = Math.floor((data.start_time - Date.now()) / 1000);
			if (seconds > 0) {
				setCountDown(seconds);
			}
		}, 10);
	}

	const handleGameStateUpdate = (state: GameState) => {
		engineState.game.old_state = engineState.game.state;
		engineState.game.state = state;
		engineState.game.last_server_update = Date.now();
	}

	const handleScoreUpdate = () => {
		engineState.game.score_update = true;
	}

	const handleGameStatusUpdate = (status: GameStatus) => {
		engineState.game.status = status;
		if (status === GameStatus.Aborted) {
			setModalState({title: '', message: ''});
			setErrorState({title: 'Game aborted', message: 'The game has been aborted because one of the players did not join the game in time'});
		} else if (status === GameStatus.Running) {
			setCountDown(0);
		}
	}

	const handleGameFinished = (data: GameFinishedPayload) => {
		engineState.game.status = GameStatus.Finished;
		setModalState({title: '', message: ''});
		setFinishPayload(data);
	}

	const handleGamePaused = (data: GamePausedPayload) => {
		engineState.game.status = GameStatus.Paused;
		let timeout_seconds = Math.floor((data.timeout_ts - Date.now())/ 1000);
		const interval = setInterval(function() {
			if (engineState.game.status !== GameStatus.Paused) {
				clearInterval(interval);
			} else {
				if (--timeout_seconds > 0) {
					setModalState({title: 'Opponent has left the game, the game will end if they don\'t reconnect in', message: timeout_seconds.toString()});
				} else {
					clearInterval(interval);
				}
			}
		}, 1000);
	}

	useSocketEvents(gameSocket, [
		{ event: 'connect', handler: handleConnection },
		{ event: 'connect_error', handler: handleConnectionError},
		{ event: 'disconnect', handler: handleDisconnect },
		{ event: 'initial_game_state', handler: handleInitialGameState },
		{ event: 'game_status_update', handler: handleGameStatusUpdate},
		{ event: 'game_state', handler: handleGameStateUpdate },
		{ event: 'score_update', handler: handleScoreUpdate },
		{ event: 'game_finished', handler: handleGameFinished },
		{ event: 'game_paused', handler: handleGamePaused }
	]);

	return (
		<div>
			<canvas ref={canvasRef}/>
			{modalState.title && <BasicModal title={modalState.title} message={modalState.message}/> }
			{countDown > 0 && <GameCountDownModal seconds={countDown} />}
			{errorState.title && <ErrorModal title={errorState.title} message={errorState.message}/> }
			{finishPayload && <GameFinishModal payload={finishPayload} />}
		</div>
	);
}

function GamePage() {
	const { user } = useUserContext();
	const location = useLocation();
	const navigate = useNavigate();
	React.useEffect(() => {
		if (!user || !location.state) {
			navigate('/');
		}
		return () => {
			gameSocket.disconnect();
		}
	}, []);
	return (
		<div className="overflow-hidden p-0 m-0">
			{location.state && <DrawGame match={location.state!} />}
		</div>
	)
}

export default GamePage;
