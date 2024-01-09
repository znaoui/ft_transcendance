import React, { useState } from 'react';
import FriendChatPanel from './FriendChatPanel';
import { useUserContext } from '../../../UserContext';
import FriendsTab from './FriendsTab';
import RequestsTab from './RequestsTab';
import ChannelTab from './ChannelTab';
import { Friend, FriendshipRequest, FriendshipStatus, FriendshipUpdate, PresenceStatus, PresenceUpdate } from '../../../models/Friend';
import useSocketEvents from '../../../sockets/useSocketsEvents';
import { chatSocket } from '../../../sockets/chat';
import { ChannelMessage, PrivateMessage } from '../../../models/Message';
import { Channel, ChannelRequest, ChannelUpdateType } from '../../../models/Channel';
import ChannelChatPanel from './ChannelChatPanel';
import { searchUsers } from '../../../api/users';
import { useNavigate } from 'react-router-dom';


type SidePanelButtonProps = {
	label: string;
	icon: string;
	onClick: (name: string) => void;
	activeTab: string;
	hasNew: boolean;
}

function SidePanelButton({ label, icon, onClick, activeTab, hasNew }: SidePanelButtonProps) {
	return (
		<button
		  onClick={() => onClick(label)}
		  className={`flex items-center mx-2 my-1 p-3 rounded
			${activeTab === label ? 'bg-gray-700' : 'hover:bg-gray-700'}
			text-white`}>
		  	<span className="mr-2">{icon}</span>
		  	{label}
			{hasNew && <div className="w-2 h-2 ml-2 bg-red-500 rounded-full"></div>}
		</button>
	  );
}

type SidebarProps = {
	activeTab: string;
	setActiveTab: (value: string) => void;
};

function SidePanel({ activeTab, setActiveTab } : SidebarProps) {
	const {
		friends,
		setFriends,
		requests,
		setRequests,
		channels,
		setChannels
	} = useUserContext();
	const navigate = useNavigate();
	const [currentFriendChat, setCurrentFriendChat] = useState<Friend | null>(null);
	const [currentChannelChat, setCurrentChannelChat] = useState<Channel | null>(null);
	const chatNotificationRef = React.useRef<any>();
	const channelChatNotificationRef = React.useRef<any>();
	const [query, setQuery] = useState('');
	const [results, setResults] = useState([] as any[]);
	const [hasNewFriend, setHasNewFriend] = useState(false);
	const [hasNewChannel, setHasNewChannel] = useState(false);
	const [hasNewRequest, setHasNewRequest] = useState(false);

	const handleSearch = async (e: any) => {
		const searchTerm = e.target.value;
		setQuery(searchTerm);

		if (searchTerm) {
			const results = await searchUsers(searchTerm);
			setResults(results);
		} else {
			setResults([]);
		}
	}

	const openChat = (friend: Friend) => {
		setCurrentFriendChat(friend);
		if (friend.hasUnread) {
			const updatedFriends = friends?.map((f: Friend) => {
				if (friend.user_id === f.user_id) {
					return { ...f, hasUnread: false };
				}
				return f;
			});
			setFriends(updatedFriends);
		}
	}

	const openChannelChat = (channel: Channel) => {
		setCurrentChannelChat(channel);
		if (channel.hasUnread) {
			const updatedChannels = channels?.map((c: Channel) => {
				if (channel.id === c.id) {
					return { ...c, hasUnread: false };
				}
				return c;
			});
			setChannels(updatedChannels);
		}
	}

	const closeChat = () => {
		setCurrentFriendChat(null);
		setCurrentChannelChat(null);
	}

	const handlePresenceUpdate = (data: PresenceUpdate) => {
		const updatedFriends = friends?.map((friend: Friend) => {
			if (data.user_id === friend.user_id) {
				if (currentFriendChat?.user_id === friend.user_id) {
					setCurrentFriendChat({...friend, presence: data.status});
				}
				return { ...friend, presence: data.status };
			}
			return friend;
		});
		setFriends(updatedFriends);
	};

	const handleFriendshipRequest = (data: FriendshipRequest) => {
		const request = {...data, sent: new Date(), status: PresenceStatus.OFFLINE};
		setRequests([...requests!, request]);
		if (activeTab !== 'Requests') {
			setHasNewRequest(true);
		}
	}

	const handleFriendshipUpdate = (data: FriendshipUpdate) => {
		if (data.status === FriendshipStatus.DELETED) {
			if (data.user_id === currentFriendChat?.user_id) {
				setCurrentFriendChat(null);
			}
			const updatedFriends = friends?.filter((friend: Friend) => friend.user_id !== data.user_id);
			setFriends(updatedFriends);
		} else {
			if (data.status === FriendshipStatus.ACCEPTED) {
				const request = requests?.find((request: any) => request.user_id === data.user_id) as FriendshipRequest | undefined;
				if (!request) return;
				request!.presence = data.presence;
				setFriends([...friends!, request]);
				if (activeTab !== 'Friends') {
					setHasNewFriend(true);
				}
			}
			const updatedRequests = requests?.filter((request: any) => request.user_id !== data.user_id);
			setRequests(updatedRequests);
		}
	};

	const handlePrivateMessage = (data: PrivateMessage) => {
		const friend = friends?.find((friend: Friend) => friend.user_id === data.receiver_id || friend.user_id === data.sender_id);
		if (friend) {
			if (currentFriendChat?.user_id === friend.user_id) {
				chatNotificationRef.current?.newMessage(data);
			} else {
				const updatedFriends = friends?.map((f: Friend) => {
					if (friend.user_id === f.user_id) {
						return { ...f, hasUnread: true };
					}
					return f;
				});
				setFriends(updatedFriends);
				if (activeTab !== 'Friends') {
					setHasNewFriend(true);
				}
			}
		}
	};

	const handleChannelMessage = (data: ChannelMessage) => {
		const channel = channels?.find((channel: Channel) => channel.id === data.channel_id);
		if (channel) {
			if (currentChannelChat?.id === channel.id) {
				channelChatNotificationRef.current?.newMessage(data);
			} else {
				const updatedChannels = channels?.map((c: Channel) => {
					if (channel.id === c.id) {
						return { ...c, hasUnread: true };
					}
					return c;
				});
				setChannels(updatedChannels);
				if (activeTab !== 'Channels') {
					setHasNewChannel(true);
				}
			}
		}
	}

	const handleChannelUpdate = (data: any) => {
		const channel = channels.find((channel: Channel) => channel.id === data.channel_id);
		if (data.type === ChannelUpdateType.KICKED
			|| data.type === ChannelUpdateType.BANNED
			|| data.type === ChannelUpdateType.LEFT
			|| data.type === ChannelUpdateType.DELETED) {
				if (!channel) return;
				if (currentChannelChat?.id === channel.id) {
					setCurrentChannelChat(null);
				}
				const updatedChannels = channels.filter((c: Channel) => c.id !== data.channel_id);
				setChannels(updatedChannels);
		} else if (data.type === ChannelUpdateType.NAME_CHANGED || data.type === ChannelUpdateType.ROLE_CHANGED) {
			if (!channel) return;
			let updatedChannel = channel;
			const updatedChannels = channels.map((c: Channel) => {
				if (channel.id === c.id) {
					updatedChannel = c;
					if (data.type === ChannelUpdateType.NAME_CHANGED) {
						if (data.name) {
							updatedChannel = { ...c, name: data.name };
						}
						if (data.channel_type) {
							updatedChannel = { ...c, type: data.channel_type };
						}
						return updatedChannel;
					} else {
						return (updatedChannel = { ...c, role: data.role });
					}
				}
				return c;
			});
			setChannels(updatedChannels);
			if (currentChannelChat?.id === updatedChannel.id) {
				setCurrentChannelChat(updatedChannel);
			}
		} else if (data.type === ChannelUpdateType.JOINED) {
			if (channel) return;
			const c = {
				id: data.channel_id,
				type: data.channel_type,
				name: data.name,
				role: data.role,
				hasUnread: true,
				muted_until: 0,
			};
			setChannels([...channels, c]);
		} else if (data.type === ChannelUpdateType.MUTED || data.type === ChannelUpdateType.UNMUTED) {
			if (!channel) return;
			if (data.type === ChannelUpdateType.MUTED) {
				setTimeout(() => {
					const updatedChannels = channels.map((c: Channel) => {
						if (channel.id === c.id) {
							return { ...c, muted_until: 0 };
						}
						return c;
					});
					setChannels(updatedChannels);
				}, data.until - Date.now());
			}
			const updatedChannels = channels.map((c: Channel) => {
				if (channel.id === c.id) {
					return { ...c, muted_until: data.until ?? 0 };
				}
				return c;
			});
			setChannels(updatedChannels);
		}
	}

	const handleChannelInvitation = (data: any) => {
		if (data.deleted) {
			setRequests(requests?.filter((request: any) => request.channel_id !== data.channel_id));
		} else {
			const request = requests?.find((request: any) => request.channel_id === data.channel_id);
			if (request) return;
			const c: ChannelRequest = {
				id: data.id,
				channel_id: data.channel_id,
				channel_name: data.channel_name,
				channel_type: data.channel_type,
				sent: new Date(),
			};
			setRequests([...requests!, c]);
			if (activeTab !== 'Requests') {
				setHasNewRequest(true);
			}
		}
	}

	const handleProfileUpdate = (data: any) => {
		const updatedFriends = friends?.map((friend: Friend) => {
			if (data.user_id === friend.user_id) {
				return { ...friend, avatar: data.avatar, username: data.username };
			}
			return friend;
		});
		setFriends(updatedFriends);
	}

	useSocketEvents(chatSocket, [
		{ event: 'presence_update', handler: handlePresenceUpdate },
		{ event: 'friendship_request', handler: handleFriendshipRequest },
		{ event: 'friendship_update', handler: handleFriendshipUpdate },
		{ event: 'friend_profile_update', handler: handleProfileUpdate },
		{ event: 'private_message', handler: handlePrivateMessage },
		{ event: 'channel_message', handler: handleChannelMessage },
		{ event: 'channel_update', handler: handleChannelUpdate },
		{ event: 'channel_invitation', handler: handleChannelInvitation },
	]);

	if (currentFriendChat) {
		return <FriendChatPanel
					ref={chatNotificationRef}
					friend={currentFriendChat}
					onClose={closeChat} />
	}
	if (currentChannelChat) {
		return <ChannelChatPanel
					ref={channelChatNotificationRef}
					channel={currentChannelChat}
					onClose={closeChat} />
	}
	const onSideButtonClick = (name: string) => {
		setActiveTab(name);
		if (name === 'Friends') {
			setHasNewFriend(false);
		} else if (name === 'Channels') {
			setHasNewChannel(false);
		} else if (name === 'Requests') {
			setHasNewRequest(false);
		}
	}
	return (
		<div className="bg-gray-800 flex flex-col w-96 h-full overflow-hidden" onBlur={() => setResults([])}>
			<div className="p-2 flex items-center h-14">
				<div className="relative w-full">
					<input className="border rounded p-1 text-black w-full h-8 focus:outline-none"
					type="text"
					value={query}
					onChange={handleSearch}
					placeholder="Search..." />
					{results.length > 0 && (
						<div className="absolute top-full w-full mt-1 bg-white border border-t-0 rounded-b text-black">
							{results.map((user, idx) => (
								<div key={idx} className="flex items-center p-2 hover:bg-gray-100 cursor-pointer" onMouseDown={() => {navigate(`/profil/${user.user_id}`); setQuery('')}}>
								<img className="h-8 w-8 rounded-full mr-2" src={user.avatar} alt={user.username} />
								<span className="truncate w-full max-w-xs">{user.username}</span>
								</div>
							))}
						</div>
					)}
				</div>
			</div>
			<hr className="h-px mx-2 bg-gray-200 border-0 dark:bg-gray-700"/>
			<SidePanelButton label="Friends" icon="👤" onClick={onSideButtonClick} activeTab={activeTab} hasNew={hasNewFriend} />
			<SidePanelButton label="Channels" icon="🚀" onClick={onSideButtonClick} activeTab={activeTab} hasNew={hasNewChannel}/>
			<SidePanelButton label="Requests" icon="✉️" onClick={onSideButtonClick} activeTab={activeTab} hasNew={hasNewRequest}/>
			<div className="w-full mt-4 px-2">
				<hr className="h-px mb-2 bg-gray-200 border-0 dark:bg-gray-700"/>
				{activeTab === 'Friends' && <FriendsTab onItemClick={openChat} setActiveTab={setActiveTab}/>}
				{activeTab === 'Channels' && <ChannelTab onItemClick={openChannelChat}/>}
				{activeTab === 'Requests' && <RequestsTab/>}
			</div>
		</div>
	);
}

export default SidePanel;
