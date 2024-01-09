import React, { useEffect, useState } from 'react';
import { useUserContext } from '../../UserContext';
import { getBlockedUsersIds, getUserInfo, getUserInvitations } from '../../api/users';
import { useNavigate } from 'react-router-dom';
import SidePanel from './sidepanel/SidePanel';
import TopBar from './TopBar';
import { chatSocket } from '../../sockets/chat';
import { getFriendRequests, getFriends } from '../../api/friends';
import { getChannels } from '../../api/channels';
import { QueryClient, QueryClientProvider } from 'react-query';
import { RecoilRoot } from 'recoil';
import { gameSocket } from '../../sockets/game';
import { Outlet } from 'react-router-dom';
import useSocketEvents from '../../sockets/useSocketsEvents';
import { InvitationReceived } from './maincontent/models/invites.model';
import { MatchFoundPayload } from './maincontent/models/matchmaking';

function DashboardComponent() {
	const [activeTab, setActiveTab] = useState('Friends');
	const [invitation, setInvitation] = React.useState<InvitationReceived | null>(null);
	const [matchData, setMatchData] = React.useState<MatchFoundPayload | null>(null);

  const handleGameInvitation = (data: InvitationReceived) => {
		setInvitation(data);
	};

	const handleMatchFound = (data: MatchFoundPayload) => {
		setInvitation(null);
		setMatchData(data);
	}

	useSocketEvents(gameSocket, [
		{ event: 'game_invitation', handler: handleGameInvitation},
		{ event: 'match_found', handler: handleMatchFound },
	]);

	const closeInvitationModal = () => {
		setInvitation(null);
	}

  return (
    <div className="flex h-screen bg-gray-600">
        <SidePanel activeTab={activeTab} setActiveTab={setActiveTab} />
        {invitation && <InviteUserModal payload={invitation} closeModal={closeInvitationModal}/>}
		{matchData && <MatchFoundModal data={matchData} />}
        <div className="flex flex-col w-full">
          <TopBar/>
          <Outlet />
        </div>
    </div>
  );
}

type MatchFoundModalProps = {
	data: MatchFoundPayload;
}

function MatchFoundModal({ data }: MatchFoundModalProps) {
	const navigate = useNavigate();

	React.useEffect(() => {
		setTimeout(() => {
			navigate('/game', { state: data });
		}, 3000);
	}, []);

	return (
		<div className="fixed inset-0 flex items-center justify-center z-50">
		<div className="relative bg-gray-700 p-8 rounded-md z-10" style={{ minWidth: '24rem' }}>
			<div className="flex flex-col items-center space-y-3">
				<h1 className="text-3xl font-bold mb-6">Match found!</h1>
				<img src={data.opponent.avatar} className="h-24 w-24 rounded-full" alt="Avatar"/>
				<span className="font-bold text-lg">{data.opponent.username}</span>
				<div className="flex justify-center items-center mt-8">
					<div className="animate-bounce flex">
						<div className="w-4 h-4 bg-gray-400 rounded-full mx-1"></div>
						<div className="w-4 h-4 bg-gray-400 rounded-full mx-1"></div>
						<div className="w-4 h-4 bg-gray-400 rounded-full mx-1"></div>
					</div>
				</div>
				<span className="text-xs">You will be redirected to the game in a few seconds...</span>
			</div>
          </div>
      </div>
	);
}

type InviteUserModalProps = {
	payload: InvitationReceived;
	closeModal: () => void;
}

function InviteUserModal({ payload, closeModal }: InviteUserModalProps) {
	const [title, setTitle] = React.useState(`${payload.inviter.username} has invited you to play!`);
	const [seconds, setSeconds] = React.useState(0);
	const [loading, setLoading] = React.useState(true);
	const [error, setError] = React.useState('');

	let interval: NodeJS.Timeout;
	React.useState(() => {
		let seconds = Math.floor((payload.expiresAt - Date.now()) / 1000);
		setSeconds(seconds);
		interval = setInterval(function() {
			if (--seconds <= 0) {
				clearInterval(interval);
				setError('Invitation expired');
				setLoading(false);
				setSeconds(0);
			} else {
				setSeconds(seconds);
			}
		}, 1000);
		return () => clearInterval(interval);
	});

	const onClose = () => {
		clearInterval(interval);
		closeModal();
	}

	const sendInvitationResponse = async (accept: boolean) => {
		const response = await gameSocket.emitWithAck('invitation_response', { accepted: accept, invitation_id: payload.id });
		if (!response.success) {
			setError(response.error);
		} else {
			setLoading(false);
			clearInterval(interval);
			setSeconds(0);
			if (accept) {
				setTitle('Waiting for match creation...');
			} else {
				onClose();
			}
		}
	}

	return (
		<div className="fixed flex flex-col justify-center items-center w-full top-0 left-0 h-full z-50">
		<div className="fixed inset-0 bg-black opacity-80"></div>
		<div className="bg-gray-700 p-4 rounded-md w-96 z-10 text-center opacity-80 relative">
		  <button onClick={onClose} className="absolute top-2 right-2 text-white hover:text-gray-400 focus:outline-none">
			<svg width="16px" height="16px" viewBox="0 -0.5 25 25" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M6.96967 16.4697C6.67678 16.7626 6.67678 17.2374 6.96967 17.5303C7.26256 17.8232 7.73744 17.8232 8.03033 17.5303L6.96967 16.4697ZM13.0303 12.5303C13.3232 12.2374 13.3232 11.7626 13.0303 11.4697C12.7374 11.1768 12.2626 11.1768 11.9697 11.4697L13.0303 12.5303ZM11.9697 11.4697C11.6768 11.7626 11.6768 12.2374 11.9697 12.5303C12.2626 12.8232 12.7374 12.8232 13.0303 12.5303L11.9697 11.4697ZM18.0303 7.53033C18.3232 7.23744 18.3232 6.76256 18.0303 6.46967C17.7374 6.17678 17.2626 6.17678 16.9697 6.46967L18.0303 7.53033ZM13.0303 11.4697C12.7374 11.1768 12.2626 11.1768 11.9697 11.4697C11.6768 11.7626 11.6768 12.2374 11.9697 12.5303L13.0303 11.4697ZM16.9697 17.5303C17.2626 17.8232 17.7374 17.8232 18.0303 17.5303C18.3232 17.2374 18.3232 16.7626 18.0303 16.4697L16.9697 17.5303ZM11.9697 12.5303C12.2626 12.8232 12.7374 12.8232 13.0303 12.5303C13.3232 12.2374 13.3232 11.7626 13.0303 11.4697L11.9697 12.5303ZM8.03033 6.46967C7.73744 6.17678 7.26256 6.17678 6.96967 6.46967C6.67678 6.76256 6.67678 7.23744 6.96967 7.53033L8.03033 6.46967ZM8.03033 17.5303L13.0303 12.5303L11.9697 11.4697L6.96967 16.4697L8.03033 17.5303ZM13.0303 12.5303L18.0303 7.53033L16.9697 6.46967L11.9697 11.4697L13.0303 12.5303ZM11.9697 12.5303L16.9697 17.5303L18.0303 16.4697L13.0303 11.4697L11.9697 12.5303ZM13.0303 11.4697L8.03033 6.46967L6.96967 7.53033L11.9697 12.5303L13.0303 11.4697Z" fill="currentColor"></path> </g></svg>
		  </button>
		  <h2 className="text-white font-semibold mb-4">{title}</h2>
		  <div className="flex-col">
			<div className="text-center text-m">
			  <div className="relative inline-block">
				{loading && <div className="absolute inset-0 flex items-center justify-center">
				  <div className="animate-spin rounded-full border-t-2 borde-white border-solid h-24 w-24"></div>
				</div>}
				<img src={payload.inviter.avatar} alt={payload.inviter.username} className="rounded-full w-24 h-24 mx-auto" />
			  </div>
			  <div className="text-white text-l font-bold mt-2">{payload.mode === 0 ? "CLASSIC" : "POWERUPS"} MODE</div>
			  {seconds > 0 && <div className="text-white text-l font-medium mt-2">{seconds}</div>}
			  {loading &&
			  	<div className="flex flex-row justify-center mt-2">
					<button onClick={() => sendInvitationResponse(true)} className="bg-green-500 rounded-md px-2 py-1 font-bold text-white text-sm hover:bg-green-600">Accept</button>
					<button onClick={() => sendInvitationResponse(false)} className="bg-red-500 rounded-md px-2 py-1 font-bold text-white text-sm ml-2 hover:bg-red-600">Decline</button>
				</div>}
			  {error && <div className="text-red-400 text-m mt-2">{error}</div>}
			</div>
		  </div>
		</div>
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

function DashboardPage() {
  const {
    user,
    setUser,
    setFriends,
    setChannels,
    setRequests,
    setBlockedUsers
   } = useUserContext();
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
      },
    },
  })

  useEffect(() => {
    document.title = 'Dashboard';
    getUserInfo().then(async (json) => {
      if (!json) {
        navigate("/login")
      } else {
        setUser({...user, id: json.id, username: json.username, avatar: json.avatar, oauth: json.oauth, has_2fa: json.has_2fa});
        const [
          loadedFriends,
          loadedChannels,
          loadedRequests,
          loadedBlocks,
          loadedChannelsRequests
        ] = await Promise.all([getFriends(), getChannels(), getFriendRequests(), getBlockedUsersIds(), getUserInvitations()]);
        setFriends(loadedFriends);
        setChannels(loadedChannels);
        setRequests([...loadedRequests, ...loadedChannelsRequests]);
        setBlockedUsers(loadedBlocks);
        if (!chatSocket.connected) {
          chatSocket.connect();
        }
        if (!gameSocket.connected) {
          gameSocket.connect();
        }
        setLoading(false);
      }
    })}, []);

  return (
    loading ? <LoadingComponent/> :
    <RecoilRoot>
      <QueryClientProvider client={queryClient}>
        <DashboardComponent/>
      </QueryClientProvider>
    </RecoilRoot>
  );
}

export default DashboardPage;
