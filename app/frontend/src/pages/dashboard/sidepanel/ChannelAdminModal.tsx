import React, {useEffect, useState } from 'react';
import { useUserContext } from '../../../UserContext';
import { Channel, ChannelBan, ChannelInvite, ChannelMute, ChannelRole, ChannelType } from '../../../models/Channel';
import { addAdmin, banUser, createChannelInvite, deleteChannelInvite, getChannelBans, getChannelInvites, getChannelMutes, getChannelUsers, kickUser, removeAdmin, transferOwnership, unMuteUser, unbanUser, updateChannel } from '../../../api/channels';
import { ChannelUser } from '../../../models/User';
import { useQuery } from 'react-query';
import { toast } from 'react-hot-toast';

type ChannelSettingsModalProps = {
	channel: Channel;
	onClose: () => void;
};

function OwnerSettingsModalContent({channel}: {channel: Channel}) {
	const [channelName, setChannelName] = useState(channel.name);
	const [channelType, setChannelType] = useState(channel.type);
	const [channelPassword, setChannelPassword] = useState('');
	const {channels, setChannels} = useUserContext();
	const onUpdateChannel = async () => {
		const response = await updateChannel(channel.id, channelName, channelType, channelPassword);
		if (response?.message) {
			toast.error(response.message);
			return;
		}
		const updatedChannel = channels.find(c => c.id === channel.id);
		if (updatedChannel) {
			updatedChannel.name = channelName;
			updatedChannel.type = channelType;
			setChannels([...channels]);
		}
		toast.success('Updated channel');
	};

	return (
	<div className="flex flex-col p-2 space-y-3">
	<div>
		<label htmlFor='channel-name' className="block mb-2 text-white text-sm font-semibold">Channel Name</label>
		<input
			id="channel-name"
			type="text"
			placeholder="my_channel"
			className="p-2 w-1/2 border text-white rounded-md w-full text-black bg-gray-600"
			value={channelName}
			onChange={(e) => setChannelName(e.target.value)}/>
	</div>
	<div>
	<label htmlFor='channel-type' className="block mb-2 text-white text-sm font-semibold">Channel Type</label>
	<ul id="channel-type" className="items-center w-full text-sm font-medium text-gray-900 bg-white border border-gray-200 rounded-lg sm:flex dark:bg-gray-700 dark:border-gray-600 dark:text-white">
		<li className="w-full border-b border-gray-200 sm:border-b-0 sm:border-r dark:border-gray-600">
			<div className="flex items-center ps-3">
				<input id="channel-public"
				type="radio"
				value="0"
				checked={channelType === 0}
				onChange={() => setChannelType(0)}
				className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-600 ring-offset-gray-700 focus:ring-offset-gray-700 focus:ring-2"/>
				<label htmlFor="channel-public" className="w-full py-3 ms-2 text-sm font-medium text-gray-300">Public</label>
			</div>
		</li>
		<li className="w-full border-b border-gray-200 sm:border-b-0 sm:border-r dark:border-gray-600">
			<div className="flex items-center ps-3">
			<input id="channel-private"
				type="radio"
				value="1"
				checked={channelType === 1}
				onChange={() => setChannelType(1)}
				className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-600 ring-offset-gray-700 focus:ring-offset-gray-700 focus:ring-2"/>
			<label htmlFor="channel-private" className="w-full py-3 ms-2 text-sm font-medium text-gray-900 dark:text-gray-300">Private</label>
			</div>
		</li>
		<li className="w-full border-b border-gray-200 sm:border-b-0 sm:border-r dark:border-gray-600">
			<div className="flex items-center ps-3">
			<input id="channel-private"
				type="radio"
				value="2"
				checked={channelType === 2}
				onChange={() => setChannelType(2)}
				className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-600 ring-offset-gray-700 focus:ring-offset-gray-700 focus:ring-2"/>
				<label htmlFor="channel-protected" className="w-full py-3 ms-2 text-sm font-medium text-gray-900 dark:text-gray-300">Protected</label>
			</div>
		</li>
	</ul>
	</div>
	{channelType === 2 && <div>
		<label htmlFor='channel-password' className="block mb-2 text-white text-sm font-semibold">Channel Password</label>
		<input
			id="channel-password"
			type="text"
			placeholder="*********"
			className="p-2 w-1/2 border text-white rounded-md w-full text-black bg-gray-600"
			value={channelPassword}
			onChange={(e) => setChannelPassword(e.target.value)}/>
	</div>}
	<div className="mt-3">
		<button className="p-2 w-full bg-blue-500 text-white rounded-md" onClick={onUpdateChannel}>
		Update
		</button>
	  </div>
  </div>)
}

function InviteUserModalContent({channel}: {channel: Channel}) {
	const [username, setUsername] = useState('');
	const onInvite = async () => {
		if (!username) return;
		const response = await createChannelInvite(channel.id, username);
		if (response?.message) {
			toast.error(response.message);
			return;
		}
		toast.success('Invited user');
	}
	return (
	<div className="flex flex-col p-2 space-y-3">
	<div>
		<label htmlFor='username' className="block mb-2 text-white text-sm font-semibold">Invite User</label>
		<input
			id="ussername"
			type="text"
			placeholder="username"
			className="p-2 w-1/2 border text-white rounded-md w-full text-black bg-gray-600"
			value={username}
			onChange={(e) => setUsername(e.target.value)}/>
	</div>
	<div className="mt-3">
		<button className="p-2 w-full bg-blue-500 text-white rounded-md" onClick={onInvite}>
		Invite
		</button>
	  </div>
  </div>)
}

function getUserRoleString(role: ChannelRole) {
	switch (role) {
		case ChannelRole.OWNER:
			return 'Owner';
		case ChannelRole.ADMIN:
			return 'Admin';
		default:
			return 'User';
	}
}

function getRoleColor(role: ChannelRole) {
	if (role === ChannelRole.OWNER) {
		return "text-red-600";
	} else if (role === ChannelRole.ADMIN) {
		return "text-orange-500";
	} else {
		return "text-slate-200";
	}
}

type ActionButtonProps = {
	name: string;
	color: string;
	channel: Channel;
	user: ChannelUser | ChannelInvite;
	onClick: (channel: Channel, user: any) => Promise<boolean>;
	rerender?: () => void;
}

const ActionButton = ({name, color, channel, user, onClick, rerender}: ActionButtonProps) => {
	const [isLoading, setIsLoading] = useState(false);
	const onAction = async () => {
		setIsLoading(true);
		if (await onClick(channel, user) && rerender) {
			rerender();
		}
		setIsLoading(false);
	}
	return (
		<button className={`p-1 bg-transparent text-xs text-${color}-400 rounded border-${color}-400 border hover:bg-gray-700`}
			onClick={onAction}>
			{isLoading ? <div className="inline-block h-3 w-3 ml-2 mr-2 animate-spin rounded-full border-2 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"/> : name}
		</button>
	)
}

const TransferOwnership = async (channel: Channel, user: ChannelUser) => {
	const response = await transferOwnership(channel.id, user.id);
	if (response?.message) {
		toast.error(response.message);
		return false;
	}
	channel.role = ChannelRole.ADMIN;
	return true;
}

const PromoteDemoteUser = async (channel: Channel, user: ChannelUser) => {
	let response;
	if (user.role === ChannelRole.ADMIN) {
		response = await removeAdmin(channel.id, user.id);
	} else {
		response = await addAdmin(channel.id, user.id);
	}
	if (response?.message) {
		toast.error(response.message);
		return false;
	}
	user.role = user.role === ChannelRole.ADMIN ? ChannelRole.USER : ChannelRole.ADMIN;
	return true;
}

const KickUser = async (channel: Channel, user: ChannelUser) => {
	const response = await kickUser(channel.id, user.id);
	if (response?.message) {
		toast.error(response.message);
		return false;
	}
	return true;
}

const BanUser = async (channel: Channel, user: ChannelUser) => {
	const response = await banUser(channel.id, user.id);
	if (response?.message) {
		toast.error(response.message);
		return false;
	}
	return true;
}

const UnbanUser = async (channel: Channel, user: ChannelUser) => {
	const response = await unbanUser(channel.id, user.id);
	if (response?.message) {
		toast.error(response.message);
		return false;
	}
	return true;
}

const UnmuteUser = async (channel: Channel, user: ChannelUser) => {
	const response = await unMuteUser(channel.id, user.id);
	if (response?.message) {
		toast.error(response.message);
		return false;
	}
	return true;
}

const DeleteInvitation = async (channel: Channel, invitation: ChannelInvite) => {
	const response = await deleteChannelInvite(channel.id, invitation.id);
	if (response?.message) {
		toast.error(response.message);
		return false;
	}
	return true;
}

function UsersListModalContent({channel}: {channel: Channel}) {
	const { user, channels, setChannels } = useUserContext();
	const [sourceName, setSourceName] = useState('Users');
	const [showListDropdown, setShowListDropdown] = useState(false);
	const [users, setUsers] = useState<Array<any>>([]);
	const menuRef = React.useRef<any>(null);

	let { data, isLoading } = useQuery(['channel_users', channel!.id], () => getChannelUsers(channel!.id, 1));
	const forceUsersRerender = () => {
		onSourceChange(sourceName, true);
		setChannels([...channels]);
	}
	useEffect(() => {
		if (data) {
		  setUsers(data);
		}
	  }, [data]);
	const onSourceChange = async (name: string, force: boolean = false) => {
		setShowListDropdown(false);
		if (name === sourceName && !force) return;
		let data: any = [];
		if (name === 'Users') {
			data = await getChannelUsers(channel!.id, 1);
		} else if (name === 'Bans') {
			data = await getChannelBans(channel!.id, 1);
		} else if (name === 'Mutes') {
			data = await getChannelMutes(channel!.id, 1);
		} else if (name === 'Invites') {
			data = await getChannelInvites(channel!.id, 1);
		}
		setUsers(data);
		setSourceName(name);
	}
	useEffect(() => {
		if (showListDropdown) {
			if (menuRef.current) {
				const rect = menuRef.current.getBoundingClientRect();
				if (rect.bottom > window.innerHeight) {
					menuRef.current.classList.remove('top-full');
					menuRef.current.classList.add('bottom-full');
				} else {
					menuRef.current.classList.remove('bottom-full');
					menuRef.current.classList.add('top-full');
				}
			}
		}
	}, [showListDropdown]);

	const userItem = (u: ChannelUser) => {
		return (
			<div key={u.id} className="flex items-center justify-between gap-4 p-2">
				<div className="flex items-center gap-4">
					<img className="w-6 h-6 rounded-full" src={u.avatar} alt="Avatar"/>
					<strong className={`text-sm font-semibold ${getRoleColor(u.role)}`}>{u.username}</strong>
				</div>
				{user!.id != u.id && u.role !== ChannelRole.OWNER && <div className="space-x-2">
					{channel.role === ChannelRole.OWNER && <ActionButton name="Ownership" channel={channel} rerender={forceUsersRerender} user={u} color="red" onClick={TransferOwnership} />}
					{channel.role === ChannelRole.OWNER && u.role === ChannelRole.USER ?
					<ActionButton name="Promote" channel={channel} rerender={forceUsersRerender} user={u} color="orange" onClick={PromoteDemoteUser} />
					:
					<ActionButton name="Demote" channel={channel} rerender={forceUsersRerender} user={u} color="gray" onClick={PromoteDemoteUser} />
					}
					<ActionButton name="Kick" channel={channel} rerender={forceUsersRerender} user={u} color="blue" onClick={KickUser} />
					<ActionButton name="Ban" channel={channel} rerender={forceUsersRerender} user={u} color="red" onClick={BanUser} />
				</div>}
			</div>
		)
	}
	const banItem = (user: ChannelBan) => {
		return (
			<div key={user.id} className="flex items-center justify-between gap-4 p-2">
				<div className="flex items-center gap-4">
					<img className="w-6 h-6 rounded-full" src={user.avatar} alt="Avatar"/>
					<div className="flex flex-col">
						<strong className={`text-sm font-semibold ${getRoleColor(user.role)}`}>{user.username}</strong>
						<span className="text-xs text-gray-400">Banned by {user.banned_by} on {user.banned_at.toLocaleDateString()}</span>
					</div>
				</div>
				<div className="space-x-2">
					<ActionButton name="Unban" channel={channel} rerender={forceUsersRerender} user={user} color="red" onClick={UnbanUser} />
				</div>
			</div>
		)
	}
	const muteItem = (user: ChannelMute) => {
		return (
			<div key={user.id} className="flex items-center justify-between gap-4 p-2">
				<div className="flex items-center gap-4">
					<img className="w-6 h-6 rounded-full" src={user.avatar} alt="Avatar"/>
					<div className="flex flex-col">
						<strong className={`text-sm font-semibold ${getRoleColor(user.role)}`}>{user.username}</strong>
						<span className="text-xs text-gray-400">Muted by {user.muted_by} until {user.until.toLocaleString()}</span>
					</div>
				</div>
				<div className="space-x-2">
					<ActionButton name="Unmute" channel={channel} rerender={forceUsersRerender} user={user} color="indigo" onClick={UnmuteUser} />
				</div>
			</div>
		)
	}
	const inviteItem = (user: ChannelInvite) => {
		return (
			<div key={user.id} className="flex items-center justify-between gap-4 p-2">
				<div className="flex items-center gap-4">
					<img className="w-6 h-6 rounded-full" src={user.avatar} alt="Avatar"/>
					<div className="flex flex-col">
						<strong className={`text-sm font-semibold text-white`}>{user.username}</strong>
						<span className="text-xs text-gray-400">Invited by {user.invited_by} on {user.invited_at.toLocaleDateString()}</span>
					</div>
				</div>
				<div className="space-x-2">
					<ActionButton name="Delete invitation" channel={channel} rerender={forceUsersRerender} user={user} color="red" onClick={DeleteInvitation} />
				</div>
			</div>
		)
	}
	return (
		<div className="flex flex-col p-2">
			<div className="relative mb-2" >
				<button className="w-20 h-7 mb-2 text-white font-medium rounded-lg text-sm inline-flex items-center justify-center bg-blue-500 hover:bg-blue-600"
					onClick={() => setShowListDropdown(!showListDropdown)}>
					{sourceName}
					<svg className="ml-3 w-2.5 h-2.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
						<path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4"/>
					</svg>
				</button>
				{showListDropdown &&
				<div className="mt-1 absolute z-10 divide-y divide-gray-100 rounded-lg shadow w-44 bg-gray-600" ref={menuRef}>
					<ul className="py-2 text-sm text-gray-200">
						<li>
							<div className="block px-4 cursor-pointer py-2 hover:bg-gray-700 hover:text-white" onClick={() => onSourceChange("Users")} >Users</div>
						</li>
						<li>
							<div className="block px-4 cursor-pointer py-2 hover:bg-gray-700 hover:text-white" onClick={() => onSourceChange("Bans")}>Bans</div>
						</li>
						<li>
							<div className="block px-4 cursor-pointer py-2 hover:bg-gray-700 hover:text-white" onClick={() => onSourceChange("Mutes")}>Mutes</div>
						</li>
						<li>
							<div className="block px-4 cursor-pointer py-2 hover:bg-gray-700 hover:text-white" onClick={() => onSourceChange("Invites")}>Invites</div>
						</li>
					</ul>
				</div>}
			</div>
			<div className="relative rounded-xl overflow-auto">
				<div className="overflow-y-auto h-23 relative bg-slate-800 highlight-white/5 shadow-lg ring-1 ring-black/5 rounded-xl flex flex-col divide-y divide-slate-200/5">
					{sourceName === "Users" && users?.map(userItem)}
					{sourceName === "Bans" && users?.map(banItem)}
					{sourceName === "Mutes" && users?.map(muteItem)}
					{sourceName === "Invites" && users?.map(inviteItem)}
				</div>
			</div>
		</div>
	)
}

function ChannelSettingsModal({channel, onClose}: ChannelSettingsModalProps) {
	const [channelName, setChannelName] = useState(channel.name);
	const [channelType, setChannelType] = useState(channel.type);
	const [channelPassword, setChannelPassword] = useState('');
	return (
		<div className="fixed inset-0 flex items-center justify-center z-50">
        <div onClick={() => onClose()}
          className="fixed inset-0 bg-black opacity-80"></div>
        <div className="bg-gray-700 p-4 rounded-md w-auto z-10" style={{ minWidth: '24rem' }}>
          <h2 className="text-white font-semibold mb-4">{channel.name}'s settings</h2>
		  {channel.role === ChannelRole.OWNER && <OwnerSettingsModalContent channel={channel} />}
		  {channel.type !== ChannelType.PROTECTED && <InviteUserModalContent channel={channel} />}
		  <UsersListModalContent channel={channel} />
        </div>
      </div>
	)
}

export default ChannelSettingsModal;
