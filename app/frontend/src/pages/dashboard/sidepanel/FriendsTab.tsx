import React, { useState } from 'react';
import { addFriend, deleteFriendship } from '../../../api/friends';
import { Friend, PresenceStatus } from '../../../models/Friend';
import { useUserContext } from '../../../UserContext';
import { blockUser } from '../../../api/users';
import { toast } from 'react-hot-toast';

type PrivateMessageItemProps = {
	friend: Friend;
	onClick: () => void;
	onDeleteClick: (event: React.MouseEvent<HTMLElement>, friend: Friend) => void;
	onBlockClick: (event: React.MouseEvent<HTMLElement>, friend: Friend) => void;
};

function PrivateMessageItem({friend, onClick, onBlockClick, onDeleteClick}: PrivateMessageItemProps) {
	return (
		<div onClick={onClick} className="my-2 w-full cursor-pointer px-2 py-1 rounded hover:bg-gray-600 group">
			<div className="flex justify-between items-center">
				<div className="flex items-center">
					<div className="relative w-10 h-10">
						<img className="w-9 h-9 rounded-full" src={friend!.avatar} alt="Avatar" />
						{friend.hasUnread &&
							<div className="absolute inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 border-2 border-white rounded-full -top-1 -right-1 dark:border-gray-800">
								!
							</div>}
					</div>
					<div className="ml-4 flex flex-col">
						<span>{friend!.username}</span>
						{friend!.presence > 0 && <div className={`text-sm/4 ${friend.presence === PresenceStatus.ONLINE ? "text-green-400" : "text-orange-400"}`}>{friend.presence === PresenceStatus.ONLINE ? "Online" : "In Game"}</div>}
					</div>
				</div>
				<div>
				<button title="Block user" className="rounded p-1 text-red-500 content-end opacity-0 group-hover:opacity-100 hover:text-white" onClick={(e) => onBlockClick(e, friend)}>
					<svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M5.63605 5.63603L18.364 18.364M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path> </g></svg>
				</button>
				<button title="Delete" className="rounded p-1 text-gray-400 content-end opacity-0 group-hover:opacity-100 hover:text-white" onClick={(e) => onDeleteClick(e, friend)}>
					<svg aria-hidden="true" role="img" width="12" height="12" viewBox="0 0 24 24"><path fill="currentColor" d="M18.4 4L12 10.4L5.6 4L4 5.6L10.4 12L4 18.4L5.6 20L12 13.6L18.4 20L20 18.4L13.6 12L20 5.6L18.4 4Z"></path></svg>
				</button>
				</div>
			</div>
		</div>
	);
}

const PrivateMessageItemMemo = React.memo(PrivateMessageItem, (prevProps, nextProps) => {
	return prevProps.friend.username === nextProps.friend.username
		&& prevProps.friend.hasUnread === nextProps.friend.hasUnread
		&& prevProps.friend.presence === nextProps.friend.presence
		&& prevProps.friend.avatar === nextProps.friend.avatar;
});

type FriendModalProps = {
	setActiveTab: (value: string) => void;
	closeModal: () => void;
};

function AddFriendModal({setActiveTab, closeModal}: FriendModalProps) {
	const [error, setError] = useState(null);
	const [username, setUsername] = useState('');
	const {requests, setRequests} = useUserContext();
	const tryAddFriend = async () => {
		if (!username) {
			return;
		}
		const reponse = await addFriend(username);
		if (reponse?.message) {
			setError(reponse.message);
			return;
		}
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
		setActiveTab('Requests');
		closeModal();
	};
	return (
		<div className="fixed inset-0 flex items-center justify-center z-50">
        <div onClick={() => closeModal()}
          className="fixed inset-0 bg-black opacity-80"></div>
        <div className="bg-gray-700 p-4 rounded-md w-96 z-10 text-center">
          <h2 className="text-white font-semibold mb-4">Add a Friend</h2>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Enter username"
              className="p-2 border rounded-md w-full text-black"
			  value={username}
			  onChange={(e) => setUsername(e.target.value)}
            />
			{error && <span className="text-red-400 text-sm text-center">{error}</span>}
            <button className="p-2 w-full bg-blue-500 text-white rounded-md" onClick={tryAddFriend}>
              Add
            </button>
          </div>
        </div>
      </div>
	);
}

type FriendsTabProp = {
	setActiveTab: (value: string) => void;
	onItemClick: (friend: Friend) => void;
};

function FriendsTab({setActiveTab, onItemClick}: FriendsTabProp) {
	const [modalOpen, setModalOpen] = useState(false);
	const {friends, setFriends, blockedUsers, setBlockedUsers} = useUserContext();
	const closeModal = () => setModalOpen(false);
	const deleteFriend = async (event: React.MouseEvent<HTMLElement>, friend: Friend) => {
		event.stopPropagation();
		const response = await deleteFriendship(friend);
		if (response?.message) {
			toast.error(response.message)
			return;
		}
		setFriends(friends!.filter((f: Friend) => f.id !== friend.id));
	}
	const blockFriend = async (event: React.MouseEvent<HTMLElement>, friend: Friend) => {
		event.stopPropagation();
		const response = await blockUser(friend.user_id);
		if (response?.message) {
			toast.error(response.message)
			return;
		}
		setFriends(friends!.filter((f: Friend) => f.id !== friend.id));
		setBlockedUsers([...blockedUsers!, friend.user_id]);
	}
	return (
		<div>
			{modalOpen && <AddFriendModal closeModal={closeModal} setActiveTab={setActiveTab}/>}
			<div className="flex justify-between items-center mb-2 p-1">
				<span className="text-white text-sm font-semibold px-3">Friends</span>
				<button className="rounded-full hover:text-gray-500" onClick={() => setModalOpen(true)}>+</button>
			</div>
			<hr className="h-px bg-gray-200 border-0 dark:bg-gray-700"/>
			{friends?.map((friend: Friend) => (
				<PrivateMessageItemMemo key={friend.id} friend={friend} onClick={() => onItemClick(friend)} onDeleteClick={deleteFriend} onBlockClick={blockFriend}/>
			))}
		</div>
	);
}

export default FriendsTab;
