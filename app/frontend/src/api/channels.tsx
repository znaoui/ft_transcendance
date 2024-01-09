import { Channel, ChannelBan, ChannelInvite, ChannelMute } from "../models/Channel";
import { ChannelMessage } from "../models/Message";
import { ChannelUser } from "../models/User";

const getChannels = async () => {
	const response = await fetch("/api/channels");
	if (!response.ok) {
		return [];
	}
	const channels = Array<Channel>();
	const json = await response.json();
	for (let i = 0; i < json.length; i++) {
		channels.push({
			id: json[i].id,
			type: json[i].type,
			name: json[i].name,
			role: json[i].role,
			hasUnread: false,
			muted_until: 0,
		});
	}
	return channels;
}

const joinChannel = async (name: string, pw: string | null) => {
	const password = pw || undefined;
	const response = await fetch("/api/channels/join", {
		method: "POST",
		headers: {
			"Content-Type": "application/json"
		},
		body: JSON.stringify({name, password})
	});
	const json = await response.json();
	return json;
}

const joinChannelById = async (channelId: number, pw: string | null) => {
	const password = pw || undefined;
	const response = await fetch(`/api/channels/${channelId}/join`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json"
		},
		body: JSON.stringify({password})
	});
	const json = await response.json();
	return json;
}

const leaveChannel = async (channelId: number) => {
	const response = await fetch(`/api/channels/${channelId}/leave`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json"
		},
	});
	if (!response.ok) {
		const json = await response.json();
		return json;
	}
	return null;
}

const createChannel = async (name: string, type: number, pw: string | null) => {
	const password = pw || undefined;
	const response = await fetch("/api/channels/create", {
		method: "POST",
		headers: {
			"Content-Type": "application/json"
		},
		body: JSON.stringify({name, type, password})
	});
	const json = await response.json();
	return json;
}

const getChannelMessages = async (channelId: number, limit: number) => {
	const response = await fetch(`/api/channels/${channelId}/messages?limit=${limit}`);
	const json = await response.json();
	const messages = Array<ChannelMessage>();
	for (let i = 0; i < json.length; i++) {
		messages.push({
			id: json[i].id,
			type: json[i].type,
			channel_id: json[i].channel_id,
			sender: {
				id: json[i].sender.user_id,
				username: json[i].sender.username,
				avatar: json[i].sender.avatar,
				role: json[i].sender.role,
			},
			content: json[i].content,
			timestamp: json[i].timestamp,
		});
	}
	return messages;
}

const kickUser = async (channelId: number, userId: number) => {
	const response = await fetch(`/api/channels/${channelId}/kick`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json"
		},
		body: JSON.stringify({user_id: userId})
	});
	if (!response.ok) {
		const json = await response.json();
		return json;
	}
	return null;
}

const banUser = async (channelId: number, userId: number) => {
	const response = await fetch(`/api/channels/${channelId}/ban`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json"
		},
		body: JSON.stringify({user_id: userId})
	});
	if (!response.ok) {
		const json = await response.json();
		return json;
	}
	return null;
}

const muteUser = async (channelId: number, userId: number, until: number) => {
	const response = await fetch(`/api/channels/${channelId}/mute`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json"
		},
		body: JSON.stringify({user_id: userId, until})
	});
	if (!response.ok) {
		const json = await response.json();
		return json;
	}
	return null;
}

const unMuteUser = async (channelId: number, userId: number) => {
	const response = await fetch(`/api/channels/${channelId}/unmute`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json"
		},
		body: JSON.stringify({user_id: userId})
	});
	if (!response.ok) {
		const json = await response.json();
		return json;
	}
	return null;
}

const updateChannel = async (channelId: number, name: string, type: number, pw: string | null) => {
	const password = pw || undefined;
	const response = await fetch(`/api/channels/${channelId}/update`, {
		method: "PUT",
		headers: {
			"Content-Type": "application/json"
		},
		body: JSON.stringify({name, type, password})
	});
	const json = await response.json();
	return json;
}

const getChannelUsers = async (channelId: number, page: number) => {
	const response = await fetch(`/api/channels/${channelId}/users?page=${page}`);
	if (!response.ok) {
		return [];
	}
	const result = Array<ChannelUser>();
	const json = await response.json();
	for (let i = 0; i < json.length; i++) {
		result.push({
			id: json[i].user_id,
			username: json[i].username,
			avatar: json[i].avatar,
			role: json[i].role,
		});
	}
	return result;
}

const getChannelBans = async (channelId: number, page: number) => {
	const response = await fetch(`/api/channels/${channelId}/bans?page=${page}`);
	if (!response.ok) {
		return [];
	}
	const result = Array<ChannelBan>();
	const json = await response.json();
	for (let i = 0; i < json.length; i++) {
		result.push({
			id: json[i].user.user_id,
			username: json[i].user.username,
			avatar: json[i].user.avatar,
			role: 0,
			banned_by: json[i].banned_by.username,
			banned_at: new Date(json[i].banned_at)
		});
	}
	return result;
}

const getChannelMutes = async (channelId: number, page: number) => {
	const response = await fetch(`/api/channels/${channelId}/muted?page=${page}`);
	if (!response.ok) {
		return [];
	}
	const result = Array<ChannelMute>();
	const json = await response.json();
	for (let i = 0; i < json.length; i++) {
		result.push({
			id: json[i].user.user_id,
			username: json[i].user.username,
			avatar: json[i].user.avatar,
			role: 0,
			muted_by: json[i].muted_by.username,
			until: new Date(json[i].muted_until)
		});
	}
	return result;
}

const transferOwnership = async (channelId: number, userId: number) => {
	const response = await fetch(`/api/channels/${channelId}/ownership/transfer`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json"
		},
		body: JSON.stringify({user_id: userId})
	});
	if (!response.ok) {
		const json = await response.json();
		return json;
	}
	return null;
}

const addAdmin = async (channelId: number, userId: number) => {
	const response = await fetch(`/api/channels/${channelId}/admin/add`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json"
		},
		body: JSON.stringify({user_id: userId})
	});
	if (!response.ok) {
		const json = await response.json();
		return json;
	}
	return null;
}

const removeAdmin = async (channelId: number, userId: number) => {
	const response = await fetch(`/api/channels/${channelId}/admin/remove`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json"
		},
		body: JSON.stringify({user_id: userId})
	});
	if (!response.ok) {
		const json = await response.json();
		return json;
	}
	return null;
}

const unbanUser = async (channelId: number, userId: number) => {
	const response = await fetch(`/api/channels/${channelId}/unban`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json"
		},
		body: JSON.stringify({user_id: userId})
	});
	if (!response.ok) {
		const json = await response.json();
		return json;
	}
	return null;
}

const getChannelInvites = async (channelId: number, page: number) => {
	const response = await fetch(`/api/channels/${channelId}/invitations?page=${page}`);
	if (!response.ok) {
		return [];
	}
	const result = Array<ChannelInvite>();
	const json = await response.json();
	for (let i = 0; i < json.length; i++) {
		result.push({
			id: json[i].id,
			user_id: json[i].user.user_id,
			avatar: json[i].user.avatar,
			username: json[i].user.username,
			invited_by: json[i].invited_by.username,
			invited_at: new Date(json[i].invited_at)
		});
	}
	return result;
}

const createChannelInvite = async (channelId: number, username: string) => {
	const response = await fetch(`/api/channels/${channelId}/invite`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json"
		},
		body: JSON.stringify({username})
	});
	const json = await response.json();
	return json;
}

const deleteChannelInvite = async (channelId: number, inviteId: number) => {
	const response = await fetch(`/api/channels/${channelId}/invitations/${inviteId}/delete`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json"
		},
	});
	if (!response.ok) {
		const json = await response.json();
		return json;
	}
	return null;
}

export {
	getChannels,
	joinChannel,
	joinChannelById,
	leaveChannel,
	createChannel,
	getChannelMessages,
	kickUser,
	banUser,
	unbanUser,
	muteUser,
	unMuteUser,
	updateChannel,
	getChannelUsers,
	getChannelBans,
	getChannelMutes,
	transferOwnership,
	addAdmin,
	removeAdmin,
	getChannelInvites,
	createChannelInvite,
	deleteChannelInvite,
};
