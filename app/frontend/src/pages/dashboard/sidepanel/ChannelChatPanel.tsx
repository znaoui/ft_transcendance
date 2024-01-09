import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { ChannelMessage, ChannelMessageType } from '../../../models/Message';
import { chatSocket } from '../../../sockets/chat';
import { useUserContext } from '../../../UserContext';
import { useQuery } from 'react-query';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { channelMessagesState } from '../States';
import { Channel, ChannelRole } from '../../../models/Channel';
import { ChannelUser } from '../../../models/User';
import { banUser, getChannelMessages, kickUser, muteUser } from '../../../api/channels';
import { PresenceStatus } from '../../../models/Friend';
import { addFriendById } from '../../../api/friends';
import { blockUser, unblockUser } from '../../../api/users';
import ChannelSettingsModal from './ChannelAdminModal';
import { inviteUser } from '../../../api/games';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

type ChatPanelProps = {
	channel: Channel | null;
	onClose: () => void;
};

const ChannelChatPanel = forwardRef<any, ChatPanelProps>(({channel, onClose}, ref) => {
	const setMessages = useSetRecoilState(channelMessagesState);
	useImperativeHandle(ref, () => ({
		newMessage(msg: ChannelMessage) {
		  addMessage(msg);
		}
	}));
	const { isLoading, isError, data, error } = useQuery(['channel_messages', channel!.id], () => getChannelMessages(channel!.id, 50));
	useEffect(() => {
		if (data) {
		  setMessages(data);
		}
	  }, [data]);
	if (isError) {
		toast.error((error as Error)?.message ?? 'An error occured while fetching messages');
	}
	const addMessage = (newMessage: ChannelMessage) => {
		setMessages(currentMessages => [newMessage, ...currentMessages]);
	};
	return (
		<div className="bg-gray-800 flex flex-col w-96 h-full overflow-hidden">
			<ChatTopBar channel={channel!} onClose={onClose} onMessageSend={addMessage} />
			<hr className="h-px mx-2 border-0 bg-gray-700"/>
			<div className="h-full flex flex-col-reverse overflow-y-auto">
				{
					isLoading ? <ChatSkeleton/> : <MessagesList channel={channel!}/>
				}
			</div>
		<ChatBar channel={channel!} onMessageSend={addMessage} />
	  </div>
	);
});

type ChatTopBarProps = {
	channel: Channel;
	onClose: () => void;
	onMessageSend: (message: ChannelMessage) => void;
};

function ChatTopBar({ channel, onClose, onMessageSend }: ChatTopBarProps) {
	const [showSettings, setShowSettings] = useState(false);
	if (showSettings) {
		return <ChannelSettingsModal channel={channel} onClose={() => setShowSettings(false)} />
	}
	return (
	<div className="p-2 flex items-center justify-between">
		<div className="flex items-center">
			<button
				className="text-white p-1 rounded hover:text-gray-500"
				onClick={onClose}>
				<svg fill="currentColor" aria-hidden="true" role="img" height="13" width="13" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> <g> <g> <path d="M441.751,475.584L222.166,256L441.75,36.416c6.101-6.101,7.936-15.275,4.629-23.253C443.094,5.184,435.286,0,426.667,0 H320.001c-5.675,0-11.093,2.24-15.083,6.251L70.251,240.917c-8.341,8.341-8.341,21.824,0,30.165l234.667,234.667 c3.989,4.011,9.408,6.251,15.083,6.251h106.667c8.619,0,16.427-5.184,19.712-13.163 C449.687,490.858,447.852,481.685,441.751,475.584z"></path> </g> </g> </g></svg>
			</button>
			<div className="flex items-center ml-5">
				<svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
					<g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M19.7225 3.20068C19.8334 2.80158 19.5997 2.38817 19.2006 2.27731C18.8015 2.16645 18.3881 2.40011 18.2773 2.79921L16.7632 8.24995H9.32006L10.7226 3.20068C10.8335 2.80158 10.5998 2.38817 10.2007 2.27731C9.80163 2.16645 9.38822 2.40011 9.27736 2.79921L7.76327 8.24995H4C3.58579 8.24995 3.25 8.58573 3.25 8.99995C3.25 9.41416 3.58579 9.74995 4 9.74995H7.3466L5.81882 15.2499H2C1.58579 15.2499 1.25 15.5857 1.25 15.9999C1.25 16.4142 1.58579 16.7499 2 16.7499H5.40216L4.27736 20.7992C4.1665 21.1983 4.40016 21.6117 4.79927 21.7226C5.19837 21.8334 5.61178 21.5998 5.72264 21.2007L6.95895 16.7499H9C9.41421 16.7499 9.75 16.4142 9.75 15.9999C9.75 15.5857 9.41421 15.2499 9 15.2499H7.37562L8.9034 9.74995H16.4872C16.5661 9.97261 16.7487 10.1546 16.9936 10.2226C17.376 10.3288 17.7715 10.1188 17.9015 9.74995H22C22.4142 9.74995 22.75 9.41416 22.75 8.99995C22.75 8.58573 22.4142 8.24995 22 8.24995H18.32L19.7225 3.20068Z"></path> <path fillRule="evenodd" clipRule="evenodd" d="M16.2132 11.2499H17.7868C18.5739 11.2499 19.2175 11.2499 19.7374 11.2994C20.2767 11.3506 20.7599 11.4603 21.1981 11.7289C21.6354 11.9969 22.0031 12.3645 22.2711 12.8018C22.5396 13.2401 22.6493 13.7233 22.7006 14.2625C22.75 14.7825 22.75 15.426 22.75 16.213V16.776C22.75 17.3363 22.75 17.7946 22.7245 18.1689C22.6981 18.5557 22.6419 18.9074 22.5026 19.2437C22.1728 20.04 21.5401 20.6727 20.7437 21.0026C20.2689 21.1993 19.7457 21.2348 19.1181 21.2456C18.8916 21.2495 18.7729 21.2523 18.6883 21.2617L18.6804 21.2626L18.6781 21.2658C18.6304 21.3312 18.5721 21.4281 18.4598 21.6179L18.1887 22.0759C17.6567 22.9746 16.3432 22.9746 15.8112 22.0759L15.5402 21.6179C15.4279 21.4281 15.3696 21.3312 15.3219 21.2658L15.3195 21.2626L15.3117 21.2617C15.2271 21.2523 15.1084 21.2495 14.8819 21.2456C14.2543 21.2348 13.7311 21.1993 13.2563 21.0026C12.4599 20.6727 11.8272 20.04 11.4974 19.2437C11.3581 18.9074 11.3019 18.5557 11.2755 18.1689C11.25 17.7946 11.25 17.3363 11.25 16.776V16.2131C11.25 15.4261 11.25 14.7825 11.2994 14.2625C11.3507 13.7233 11.4604 13.2401 11.7289 12.8018C11.9969 12.3645 12.3646 11.9969 12.8019 11.7289C13.2401 11.4603 13.7233 11.3506 14.2626 11.2994C14.7825 11.2499 15.4261 11.2499 16.2132 11.2499ZM14.4045 12.7926C13.9751 12.8335 13.7486 12.908 13.5856 13.0078C13.3502 13.1521 13.1522 13.3501 13.0079 13.5856C12.908 13.7485 12.8335 13.9751 12.7927 14.4045C12.7508 14.8451 12.75 15.4171 12.75 16.25V16.75C12.75 17.3427 12.7504 17.7496 12.772 18.0668C12.7932 18.3773 12.8322 18.5466 12.8832 18.6697C13.0608 19.0985 13.4015 19.4392 13.8303 19.6168C14.0158 19.6936 14.28 19.735 14.9077 19.7458L14.9335 19.7463C15.1236 19.7495 15.314 19.7528 15.4768 19.7708C15.6609 19.7912 15.8701 19.8354 16.0785 19.9566C16.2843 20.0763 16.4252 20.2329 16.5341 20.3823C16.6293 20.5129 16.7242 20.6734 16.8179 20.8317L17 21.1394L17.1821 20.8317C17.2758 20.6734 17.3707 20.5129 17.4659 20.3823C17.5748 20.2329 17.7156 20.0763 17.9215 19.9566C18.1298 19.8354 18.3391 19.7912 18.5232 19.7708C18.686 19.7528 18.8762 19.7495 19.0663 19.7463L19.0923 19.7458C19.72 19.735 19.9842 19.6936 20.1697 19.6168C20.5985 19.4392 20.9392 19.0985 21.1168 18.6697C21.1678 18.5466 21.2068 18.3773 21.228 18.0668C21.2496 17.7496 21.25 17.3427 21.25 16.75V16.25C21.25 15.4171 21.2492 14.8451 21.2073 14.4045C21.1665 13.9751 21.092 13.7485 20.9921 13.5856C20.8478 13.3501 20.6498 13.1521 20.4144 13.0078C20.2514 12.908 20.0249 12.8335 19.5955 12.7926C19.1549 12.7507 18.5829 12.7499 17.75 12.7499H16.25C15.4171 12.7499 14.8451 12.7507 14.4045 12.7926Z" fill="#858585"></path> </g>
				</svg>
				<div className="text-white font-semibold ml-2 truncate w-30">{channel!.name}</div>
			</div>
		</div>
		<div className="flex">
			{/*<button className="text-white p-1 rounded" title="Invite user" onClick={sendGameInvite}>
				{!isSendingInvite ?
					(<svg width="21" height="21" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> <path fillRule="evenodd" clipRule="evenodd" d="M12.75 6V3.75H11.25V6L9 6C6.10051 6 3.75 8.3505 3.75 11.25V17.909C3.75 19.2019 4.7981 20.25 6.09099 20.25C6.71186 20.25 7.3073 20.0034 7.74632 19.5643L10.8107 16.5H13.1893L16.2537 19.5643C16.6927 20.0034 17.2881 20.25 17.909 20.25C19.2019 20.25 20.25 19.2019 20.25 17.909V11.25C20.25 8.3505 17.8995 6 15 6L12.75 6ZM18.75 11.25C18.75 9.17893 17.0711 7.5 15 7.5L9 7.5C6.92893 7.5 5.25 9.17893 5.25 11.25V17.909C5.25 18.3735 5.62652 18.75 6.09099 18.75C6.31403 18.75 6.52794 18.6614 6.68566 18.5037L10.1893 15H13.8107L17.3143 18.5037C17.4721 18.6614 17.686 18.75 17.909 18.75C18.3735 18.75 18.75 18.3735 18.75 17.909V11.25ZM6.75 12.75V11.25H8.25V9.75H9.75V11.25H11.25V12.75H9.75V14.25H8.25V12.75H6.75ZM15 10.875C15 11.4963 14.4963 12 13.875 12C13.2537 12 12.75 11.4963 12.75 10.875C12.75 10.2537 13.2537 9.75 13.875 9.75C14.4963 9.75 15 10.2537 15 10.875ZM16.125 14.25C16.7463 14.25 17.25 13.7463 17.25 13.125C17.25 12.5037 16.7463 12 16.125 12C15.5037 12 15 12.5037 15 13.125C15 13.7463 15.5037 14.25 16.125 14.25Z" fill="currentColor"></path> </g></svg>)
					:
					(<svg aria-hidden="true" className="inline w-4 h-4 mr-2 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
						<path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
						<path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/>
					</svg>)
				}
			</button> */}
			{channel.role !== ChannelRole.USER && <button className="text-white rounded" title="Settings" onClick={() => setShowSettings(true)}>
				<svg width="21" height="21" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
					<g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> <path fillRule="evenodd" clipRule="evenodd" d="M10.65 3L9.93163 3.53449L9.32754 5.54812L7.47651 4.55141L6.5906 4.68143L4.68141 6.59062L4.55139 7.47652L5.5481 9.32755L3.53449 9.93163L3 10.65V13.35L3.53449 14.0684L5.54811 14.6725L4.55142 16.5235L4.68144 17.4094L6.59063 19.3186L7.47653 19.4486L9.32754 18.4519L9.93163 20.4655L10.65 21H13.35L14.0684 20.4655L14.6725 18.4519L16.5235 19.4486L17.4094 19.3185L19.3186 17.4094L19.4486 16.5235L18.4519 14.6724L20.4655 14.0684L21 13.35V10.65L20.4655 9.93163L18.4519 9.32754L19.4486 7.47654L19.3186 6.59063L17.4094 4.68144L16.5235 4.55142L14.6725 5.54812L14.0684 3.53449L13.35 3H10.65ZM10.4692 6.96284L11.208 4.5H12.792L13.5308 6.96284L13.8753 7.0946C13.9654 7.12908 14.0543 7.16597 14.142 7.2052L14.4789 7.35598L16.7433 6.13668L17.8633 7.25671L16.644 9.52111L16.7948 9.85803C16.834 9.9457 16.8709 10.0346 16.9054 10.1247L17.0372 10.4692L19.5 11.208V12.792L17.0372 13.5308L16.9054 13.8753C16.8709 13.9654 16.834 14.0543 16.7948 14.1419L16.644 14.4789L17.8633 16.7433L16.7433 17.8633L14.4789 16.644L14.142 16.7948C14.0543 16.834 13.9654 16.8709 13.8753 16.9054L13.5308 17.0372L12.792 19.5H11.208L10.4692 17.0372L10.1247 16.9054C10.0346 16.8709 9.94569 16.834 9.85803 16.7948L9.52111 16.644L7.25671 17.8633L6.13668 16.7433L7.35597 14.4789L7.2052 14.142C7.16597 14.0543 7.12908 13.9654 7.0946 13.8753L6.96284 13.5308L4.5 12.792L4.5 11.208L6.96284 10.4692L7.0946 10.1247C7.12907 10.0346 7.16596 9.94571 7.20519 9.85805L7.35596 9.52113L6.13666 7.2567L7.25668 6.13667L9.5211 7.35598L9.85803 7.2052C9.9457 7.16597 10.0346 7.12908 10.1247 7.0946L10.4692 6.96284ZM14.25 12C14.25 13.2426 13.2426 14.25 12 14.25C10.7574 14.25 9.75 13.2426 9.75 12C9.75 10.7574 10.7574 9.75 12 9.75C13.2426 9.75 14.25 10.7574 14.25 12ZM15.75 12C15.75 14.0711 14.0711 15.75 12 15.75C9.92893 15.75 8.25 14.0711 8.25 12C8.25 9.92893 9.92893 8.25 12 8.25C14.0711 8.25 15.75 9.92893 15.75 12Z" fill="currentColor"></path> </g>
				</svg>
			</button>}
		</div>
	</div>)
}

type MuteDurationModalProps = {
	channel: Channel;
	user: ChannelUser;
	onClose: () => void;
};

function MuteDurationModal({channel, user, onClose}: MuteDurationModalProps) {
	const [duration, setDuration] = useState({days: 0, hours: 0, minutes: 0});
	const [error, setError] = useState('');
	const onMuteUser = async () => {
		if (!duration.days && !duration.hours && !duration.minutes) {
			setError('Please enter a valid duration');
			return;
		}
		const timestamp = Date.now() + (((duration.days * 86400) + (duration.hours * 3600) + (duration.minutes * 60)) * 1000);
		const response = await muteUser(channel.id, user.id, timestamp);
		if (response?.message) {
			toast.error(response.message);
		}
		onClose();
	};
	return (
		<div className="fixed inset-0 flex items-center justify-center z-50">
        <div onClick={() => onClose()}
          className="fixed inset-0 bg-black opacity-80"></div>
        <div className="bg-gray-700 p-4 rounded-md w-96 z-10 text-center">
          <h2 className="text-white font-semibold mb-4">Mute {user.username}</h2>
		  <div className="flex flex-col p-4 space-y-3 items-center">
			<div className="flex flex-row items-center space-x-3">
				<input
					type="text"
					pattern='[0-9]*'
					placeholder="0"
					className="rounded-full p-2 bg-gray-600 text-white text-center w-10"
					value={duration.days}
					onChange={e => setDuration({...duration, days: parseInt(e.target.value) || 0})}
				/>
				<span className="text-white">Days</span>
			</div>
			<div className="flex flex-row items-center space-x-3">
				<input
					type="text"
					pattern='[0-9]*'
					placeholder="0"
					className="rounded-full p-2 bg-gray-600 text-white text-center w-10"
					value={duration.hours}
					onChange={e => setDuration({...duration, hours: parseInt(e.target.value) || 0})}
				/>
				<span className="text-white">Hours</span>
			</div>
			<div className="flex flex-row items-center space-x-3">
				<input
					type="text"
					pattern='[0-9]*'
					placeholder="0"
					className="rounded-full p-2 bg-gray-600 text-white text-center w-10"
					value={duration.minutes}
					onChange={e => setDuration({...duration, minutes: parseInt(e.target.value) || 0})}
				/>
				<span className="text-white">Minutes</span>
			</div>
		  </div>
          <div className="space-y-3">
			{error && <span className="text-red-400 text-sm text-center">{error}</span>}
            <button className="p-2 w-full bg-blue-500 text-white rounded-md" onClick={onMuteUser}>
              Mute
            </button>
          </div>
        </div>
      </div>
	)
}

type UserContextMenuProps = {
	channel: Channel;
	user: ChannelUser;
	x: number;
	y: number;
	onClose: () => void;
};

const UserContextMenu = (({ channel, user, x, y, onClose}: UserContextMenuProps) => {
	const {
		friends,
		setFriends,
		blockedUsers,
		setBlockedUsers,
		requests,
		setRequests
	} = useUserContext();
	const navigate = useNavigate();
	const [showMuteModal, setShowMuteModal] = useState(false);
	const menuRef = useRef<HTMLDivElement>(null);
	useEffect(() => {
		const handleOutsideClick= (event: any) => {
			if (menuRef.current && !menuRef.current.contains(event.target)) {
			  onClose();
			}
		  }
		document.addEventListener('mousedown', handleOutsideClick);
		return () => {
			document.removeEventListener('mousedown', handleOutsideClick);
		}
	}, []);
	const isUserBlocked = blockedUsers.includes(user.id);
	const hasFriendship = friends.find(f => f.user_id === user.id) !== undefined || requests.find((f: any) => f.user_id === user.id) !== undefined;
	const contextHeight = channel.role === ChannelRole.USER ? 250 : 350;
	if (y + contextHeight > window.innerHeight) {
		y = window.innerHeight - contextHeight;
	}
	const onKick = async () => {
		const response = await kickUser(channel.id, user.id);
		if (response?.message) {
			toast.error(response.message);
		}
		onClose();
	}
	const onBan = async () => {
		const response = await banUser(channel.id, user.id);
		if (response?.message) {
			toast.error(response.message);
		}
		onClose();
	}
	const onFriendRequest = async () => {
		const reponse = await addFriendById(user.id);
		if (reponse?.message) {
			toast.error(reponse.message);
		} else {
			setRequests([...requests!, {
				id: reponse.id,
				user_id: reponse.user_id,
				username: reponse.username,
				avatar: reponse.avatar,
				sender_id: reponse.sender_id,
				sent: new Date(reponse.sent),
				hasUnread: false,
				presence: PresenceStatus.OFFLINE,
			}]);
		}
		onClose();
	}
	const onBlockUnblock = async () => {
		const response = isUserBlocked ? await unblockUser(user.id) : await blockUser(user.id);
		if (response?.message) {
			toast.error(response.message);
			return;
		}
		if (isUserBlocked) {
			setBlockedUsers(blockedUsers.filter(id => id !== user.id));
		} else {
			setBlockedUsers([...blockedUsers, user.id]);
			if (hasFriendship) {
				setRequests(requests.filter((request: any) => request.user_id !== user.id));
				setFriends(friends.filter((friend: any) => friend.user_id !== user.id));
			}
		}
		onClose();
	}

	const onPlayerInvite = async () => {
		const response = await inviteUser(user.id);
		if (response?.message) {
			toast.error(response.message);
		} else {
			toast.success(`Invite sent to ${user.username}`);
		}
	}

	if (showMuteModal) {
		return <MuteDurationModal user={user} onClose={() => setShowMuteModal(false)} channel={channel} />
	}


	return (
	<div ref={menuRef} style={{left: `${x}px`, top: `${y}px`, position: 'absolute'}} className="z-10 bg-white divide-y divide-gray-100 rounded-lg shadow w-44 dark:bg-gray-700 dark:divide-gray-600">
		<div className="px-4 py-3 text-sm text-gray-900">
			<div className="flex items-center">
				<img className="w-7 h-7 rounded-full" src={user.avatar} alt="Avatar" />
				<div className="ml-3">
					<div className="text-sm font-medium truncate text-white">{user.username}</div>
					{user.role !== ChannelRole.USER && <div className={`text-xs font-bold truncate ${getRoleColor(user.role)}`}>{getRoleString(user.role)}</div>}
				</div>
			</div>
		</div>
		<ul className="py-2 text-sm text-gray-700 dark:text-gray-200">
		{channel.role !== ChannelRole.USER && user.role !== ChannelRole.OWNER &&
		<div>
			<li>
				<div onClick={onKick} className="block cursor-pointer px-4 py-2 hover:bg-gray-600 hover:text-white">Kick</div>
			</li>
			<li>
				<div onClick={() => setShowMuteModal(true)} className="block cursor-pointer px-4 py-2 hover:bg-gray-600 hover:text-white">Mute</div>
			</li>
			<li>
				<div onClick={onBan} className="block cursor-pointer px-4 py-2 hover:bg-gray-600 hover:text-white">Ban</div>
			</li>
		</div>
		}
		{!isUserBlocked && !hasFriendship &&
		<li>
			<div onClick={onFriendRequest} className="block cursor-pointer px-4 py-2 hover:bg-gray-600 hover:text-white">Friend Request</div>
		</li>
		}
		<li>
			<div onClick={onBlockUnblock} className="block cursor-pointer px-4 py-2 hover:bg-gray-600 hover:text-white">{isUserBlocked ? "Unblock" : "Block"}</div>
		</li>
		<li>
			<div onClick={onPlayerInvite} className="block cursor-pointer px-4 py-2 hover:bg-gray-600 hover:text-white">Invite To Play</div>
		</li>
		<li>
			<div className="block cursor-pointer px-4 py-2 hover:bg-gray-600 hover:text-white" onClick={() => navigate(`/profil/${user.id}`)} >Profile</div>
		</li>
		</ul>
	</div>
	);
});

function MessagesList({channel}: {channel: Channel}) {
	const { user } = useUserContext();
	const messages = useRecoilValue(channelMessagesState);
	const [dropdownContext, setDropdownContext] = useState<{user: ChannelUser, x: number, y: number} | null>(null);
	const { blockedUsers } = useUserContext();
	const onUserClick = (u: ChannelUser, e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
		e.preventDefault();
		if (u.id !== user!.id) {
			setDropdownContext({user: u, x: e.clientX, y: e.clientY});
		}
	}
	return (
		<div className="flex flex-col-reverse overflow-y-auto">
			{dropdownContext &&
			<UserContextMenu onClose={() => setDropdownContext(null)}
				channel={channel}
				user={dropdownContext.user}
				x={dropdownContext.x}
				y={dropdownContext.y} />}
			{messages.map((msg) => {
				let content = msg.type !== ChannelMessageType.EVENT && blockedUsers.includes(msg.sender.id) ? null : msg.content;
				return <ChatMessage key={msg.id}
							type={msg.type}
							sender={msg.sender}
							content={content}
							date={new Date(msg.timestamp)}
							onUserClick={onUserClick}/>
			})}
		</div>
	);
}

type ChatMessageProps = {
	type: ChannelMessageType;
	sender: ChannelUser;
	content: string | null;
	date: Date;
	onUserClick: (user: ChannelUser, e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
};

function getRoleColor(role: ChannelRole) {
	if (role === ChannelRole.OWNER) {
		return "text-red-600";
	} else if (role === ChannelRole.ADMIN) {
		return "text-orange-500";
	} else {
		return "text-white";
	}
}

function getRoleString(role: ChannelRole) {
	if (role === ChannelRole.OWNER) {
		return "Owner";
	} else if (role === ChannelRole.ADMIN) {
		return "Admin";
	} else {
		return "User";
	}
}

type MessageProps = {
	type: ChannelMessageType;
	content: string | null;
	userIsSender: boolean;
};

function Message({ type, content, userIsSender }: MessageProps) {
	if (!content) {
		return (<div className="text-gray-400">User blocked</div>);
	} else if (type === ChannelMessageType.MESSAGE) {
		return (<div className="text-white">{content}</div>);
	} else if (type === ChannelMessageType.GAME_INVITE) {
		const style = !userIsSender ? "from-blue-500 via-blue-600 to-blue-700 shadow-blue-800/80" : "from-gray-500 via-gray-600 to-gray-700";
		return (
			<button type="button" className={`text-white bg-gradient-to-r ${style} hover:bg-gradient-to-br shadow-lg font-medium rounded-lg text-sm px-5 py-2.5 text-center mr-2 mb-2`}>
				{content}
			</button>
		);
	} else if (type === ChannelMessageType.EVENT) {
		return (<div className="text-gray-400">{content}</div>);
	} else {
		return (<div className="text-red-500">Unknown message type</div>);
	}
}

function ChatMessage({ type, sender, content, date, onUserClick }: ChatMessageProps) {
	const {user} = useUserContext();
	return (
		<div className="flex items-start space-x-2 px-2 py-1">
		<img src={sender.avatar} alt="Avatar" className="w-8 h-8 rounded-full" />
		<div>
			<div className="flex items-center space-x-1">
				<button onClick={(e) => onUserClick(sender, e)} className={`font-bold cursor-pointer ${getRoleColor(sender.role)}`}>{sender.username}</button>
				<div className="text-xs text-gray-400">
					{date.toDateString() === new Date().toDateString() ?
					`${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
					: `${date.toLocaleDateString()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}` }
				</div>
			</div>
			<Message type={type} content={content} userIsSender={sender.id === user!.id}/>
		</div>
	  </div>
	);
}

function ChatSkeleton() {
	const skeletonCount = 20;
	return (
		<div role="status" className="space-y-2.5 animate-pulse max-w-lg">
			<div className="flex-1 p-2 rounded overflow-y-auto">
				{Array.from({ length: skeletonCount }, (_, index) => (
					<SkeletonChatMessage key={index} />
				))}
			</div>
	  </div>
	);
  }

function SkeletonChatMessage() {
	function SkeletonMsgRandomWidth () {
		const width = Math.floor(Math.random()*12)*4+16;
		return (<div className={`h-2 rounded-full bg-gray-700 w-${width} mb-1`}></div>);
	}
	return (
		<div className="flex items-start space-x-2 px-2 py-1">
		<div className="h-8 w-8 bg-gray-700 rounded-full"/>
		<div>
			<div className="h-3 rounded-full bg-gray-700 text-transparent mb-1.5 w-16"></div>
			{Array.from({ length: Math.floor(Math.random() * (5 - 2 + 1) + 2) }, (_, index) => (
				<SkeletonMsgRandomWidth key={index}/>
			))}
		</div>
	</div>
	)
}

type ChatBarProps = {
	channel: Channel;
	onMessageSend: (message: ChannelMessage) => void;
};

function ChatBar({ channel, onMessageSend }: ChatBarProps) {
	const [message, setMessage] = useState('');
	const { user } = useUserContext();
	const sendMessage = async () => {
		const msg = message.trim();
		if(!msg) {
			return;
		}
		const data = await chatSocket.emitWithAck('channel_message', {
			type: ChannelMessageType.MESSAGE,
			channel_id: channel.id,
			content: message
		});
		if (data.success) {
			setMessage('');
			const msg: ChannelMessage = {
				id: data.id,
				type: ChannelMessageType.MESSAGE,
				sender: {
					id: user!.id,
					username: user!.username,
					avatar: user!.avatar,
					role: channel.role
				},
				channel_id: channel.id,
				content: message,
				timestamp: Date.now()
			}
			onMessageSend(msg);
		} else {
			toast.error(data.error_message);
		}
	};
	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === 'Enter') {
			e.preventDefault();
			sendMessage();
		}
	};
	return (
	  <div className="p-2 border-t border-gray-700">
		<input
		  type="text"
		  placeholder={channel.muted_until > Date.now() ? "You are muted" : "Type a message..."}
		  value={message}
		  onChange={(e) => setMessage(e.target.value)}
		  onKeyDown={handleKeyDown}
		  className="w-full p-2 rounded bg-gray-600 border-none text-white placeholder-gray-400 focus:outline-none focus:border-none border border-gray-700"
		  disabled={channel.muted_until > Date.now()}
		  />
	  </div>
	);
}

export default ChannelChatPanel;
