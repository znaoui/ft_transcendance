import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { Friend, PresenceStatus } from '../../../models/Friend';
import { PrivateMessage, PrivateMessageType } from '../../../models/Message';
import { chatSocket } from '../../../sockets/chat';
import { useUserContext } from '../../../UserContext';
import { useQuery } from 'react-query';
import { getPrivateMessages } from '../../../api/friends';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { messagesState } from '../States';
import { inviteUser } from '../../../api/games';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';

type ChatPanelProps = {
	friend: Friend | null;
	onClose: () => void;
};

const FriendChatPanel = forwardRef<any, ChatPanelProps>(({friend, onClose}, ref) => {
	const setMessages = useSetRecoilState(messagesState);
	useImperativeHandle(ref, () => ({
		newMessage(msg: PrivateMessage) {
		  addMessage(msg);
		}
	}));
	const { isLoading, isError, data, error } = useQuery(['messages', friend!.user_id], () => getPrivateMessages(friend!.id, 50));
	useEffect(() => {
		if (data) {
		  setMessages(data);
		}
	  }, [data]);
	if (isError) {
		toast.error((error as Error)?.message ?? 'An error occured while fetching messages');
	}
	const addMessage = (newMessage: PrivateMessage) => {
		setMessages(currentMessages => [newMessage, ...currentMessages]);
	};
	return (
		<div className="bg-gray-800 flex flex-col w-96 h-full">
			<ChatTopBar friend={friend!} onClose={onClose} onMessageSend={addMessage} />
			<hr className="h-px mx-2 border-0 bg-gray-700"/>
			<div className="h-full flex flex-col-reverse overflow-y-auto">
				{
					isLoading ? <ChatSkeleton/> : <MessagesList friend={friend!}/>
				}
			</div>
		<ChatBar friendUserId={friend!.user_id} onMessageSend={addMessage} />
	  </div>
	);
});

type ChatTopBarProps = {
	friend: Friend;
	onClose: () => void;
	onMessageSend: (message: PrivateMessage) => void;
};

function ChatTopBar({ friend, onClose, onMessageSend }: ChatTopBarProps) {
	const [isSendingInvite, setIsSendingInvite] = useState(false);
	const { user } = useUserContext();

	const sendGameInvite = async () => {
		setIsSendingInvite(true);
		const inviteData = await inviteUser(friend.user_id);
		if (inviteData.success) {
			toast.success('Game invite sent!');
			const data = await chatSocket.emitWithAck('private_message', {
				type: PrivateMessageType.GAME_INVITE,
				user_id: friend.user_id,
				content: 'Play a game with me!'
			});
			if (data.message) {
				toast.error(data.message);
			} else {
				onMessageSend({
					id: data.id,
					type: PrivateMessageType.GAME_INVITE,
					sender_id: user!.id,
					receiver_id: friend.user_id,
					content: 'Play a game with me!',
					timestamp: Date.now()
				});
			}
		} else {
			toast.error(inviteData.message);
		}
		setIsSendingInvite(false);
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
				<div className="relative">
					<img src={friend!.avatar} alt="User Avatar" className="w-7 h-7 rounded-full mr-4" />
					<span className={`${friend!.presence === PresenceStatus.ONLINE ? "bg-green-400" : (friend!.presence === PresenceStatus.IN_GAME ? 'bg-orange-400' : 'bg-gray-400')} bottom-0 left-5 absolute w-3.5 h-3.5 border-2 border-gray-800 rounded-full`}></span>
				</div>
				<div className="text-white font-semibold truncate w-32">
					<Link to={`/profil/${friend!.user_id}`}>{friend!.username}</Link>
				</div>
			</div>
		</div>
		<div className="flex">
			<button className="text-white p-1 rounded" title="Invite user" onClick={sendGameInvite}>
				{!isSendingInvite ?
					(<svg width="21" height="21" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> <path fillRule="evenodd" clipRule="evenodd" d="M12.75 6V3.75H11.25V6L9 6C6.10051 6 3.75 8.3505 3.75 11.25V17.909C3.75 19.2019 4.7981 20.25 6.09099 20.25C6.71186 20.25 7.3073 20.0034 7.74632 19.5643L10.8107 16.5H13.1893L16.2537 19.5643C16.6927 20.0034 17.2881 20.25 17.909 20.25C19.2019 20.25 20.25 19.2019 20.25 17.909V11.25C20.25 8.3505 17.8995 6 15 6L12.75 6ZM18.75 11.25C18.75 9.17893 17.0711 7.5 15 7.5L9 7.5C6.92893 7.5 5.25 9.17893 5.25 11.25V17.909C5.25 18.3735 5.62652 18.75 6.09099 18.75C6.31403 18.75 6.52794 18.6614 6.68566 18.5037L10.1893 15H13.8107L17.3143 18.5037C17.4721 18.6614 17.686 18.75 17.909 18.75C18.3735 18.75 18.75 18.3735 18.75 17.909V11.25ZM6.75 12.75V11.25H8.25V9.75H9.75V11.25H11.25V12.75H9.75V14.25H8.25V12.75H6.75ZM15 10.875C15 11.4963 14.4963 12 13.875 12C13.2537 12 12.75 11.4963 12.75 10.875C12.75 10.2537 13.2537 9.75 13.875 9.75C14.4963 9.75 15 10.2537 15 10.875ZM16.125 14.25C16.7463 14.25 17.25 13.7463 17.25 13.125C17.25 12.5037 16.7463 12 16.125 12C15.5037 12 15 12.5037 15 13.125C15 13.7463 15.5037 14.25 16.125 14.25Z" fill="currentColor"></path> </g></svg>)
					:
					(<svg aria-hidden="true" className="inline w-4 h-4 mr-2 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
						<path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
						<path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/>
					</svg>)
				}
			</button>
		</div>
	</div>)
}

type MessagesListProps = {
	friend: Friend;
};

function MessagesList({ friend }: MessagesListProps) {
	const { user } = useUserContext();
	const messages = useRecoilValue(messagesState);
	return (
		<div className="flex flex-col-reverse overflow-y-auto">
			{messages.map((msg) => {
				const sender = msg.sender_id === friend.user_id ? friend : user!;
				return <ChatMessage key={msg.id} type={msg.type} sender={sender} content={msg.content} date={new Date(msg.timestamp)} />
			})}
		</div>
	);
}

type ChatMessageProps = {
	type: PrivateMessageType;
	sender: any;
	content: string;
	date: Date;
};

function ChatMessage({ type, sender, content, date }: ChatMessageProps) {
	const {user} = useUserContext();
	return (
		<div className="flex items-start space-x-2 px-2 py-1">
		<img src={sender.avatar} alt="Avatar" className="w-8 h-8 rounded-full" />
		<div>
			<div className="flex items-center space-x-1">
				<div className="font-bold text-white">
					{sender.username}
				</div>
				<div className="text-xs text-gray-400">
					{date.toDateString() === new Date().toDateString() ?
					`${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
					: `${date.toLocaleDateString()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}` }
				</div>
			</div>
			{type === PrivateMessageType.MESSAGE ?
				(<div className="text-white">{content}</div>) :
				(<button type="button" className={`text-white bg-gradient-to-r ${sender !== user ? "from-blue-500 via-blue-600 to-blue-700 shadow-blue-800/80" : "from-gray-500 via-gray-600 to-gray-700"} hover:bg-gradient-to-br shadow-lg font-medium rounded-lg text-sm px-5 py-2.5 text-center mr-2 mb-2`}>{content}</button>)
			}
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
	friendUserId: number;
	onMessageSend: (message: PrivateMessage) => void;
};

function ChatBar({ friendUserId, onMessageSend }: ChatBarProps) {
	const [message, setMessage] = useState('');
	const { user } = useUserContext();
	const sendMessage = async () => {
		const msg = message.trim();
		if(!msg) {
			return;
		}
		const data = await chatSocket.emitWithAck('private_message', {
			type: PrivateMessageType.MESSAGE,
			user_id: friendUserId,
			content: message
		});
		if (data.success) {
			setMessage('');
			onMessageSend({
				id: data.id,
				type: PrivateMessageType.MESSAGE,
				sender_id: user!.id,
				receiver_id: friendUserId,
				content: msg,
				timestamp: Date.now()
			});
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
		  placeholder="Type your message..."
		  value={message}
		  onChange={(e) => setMessage(e.target.value)}
		  onKeyDown={handleKeyDown}
		  className="w-full p-2 rounded bg-gray-600 border-none text-white placeholder-gray-400 focus:outline-none focus:border-none border border-gray-700"
		  />
	  </div>
	);
}

export default FriendChatPanel;
