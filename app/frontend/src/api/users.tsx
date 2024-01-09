import { ChannelRequest } from "../models/Channel";
import { ChannelUser, User, UserBase } from "../models/User";

const getUserInfo = async () => {
	const result = await fetch('/api/users/me', {
		method: 'GET'
	});
	if (result.status === 200) {
		const json = await result.json();
		return json
	}
	return null
}

const searchUsers = async(username: string) => {
	const result = await fetch(`/api/users/search?username=${username}`, {
		method: 'GET'
	});
	if (result.status === 200) {
		const json = await result.json();
		return json
	}
	return []
}

const getUserById = async(id: string | undefined) => {
	const result = await fetch(`/api/users/${id}/profile`, {
		method: 'GET'
	});
	if (result.status === 200){
		const json = await result.json();
		return json
	}
	return null
}

const getUserInvitations = async() => {
	const result = await fetch(`/api/channels/invitations`, {
		method: 'GET'
	});
	let invitations: Array<ChannelRequest> = [];
	if (result.status === 200) {
		const json = await result.json();
		for (let i = 0; i < json.length; i++) {
			invitations.push({
				id: json[i].id,
				channel_id: json[i].channel_id,
				channel_name: json[i].channel_name,
				channel_type: json[i].channel_type,
				sent: new Date(json[i].sent_at)
			})
		}
	}
	return invitations
}

const blockUser = async(user_id: number) => {
	const result = await fetch(`/api/users/${user_id}/block`, {
		method: 'POST'
	});
	if (!result.ok) {
		const json = await result.json();
		return json
	}
	return null
}

const unblockUser = async(user_id: number) => {
	const result = await fetch(`/api/users/${user_id}/unblock`, {
		method: 'POST'
	});
	if (!result.ok) {
		const json = await result.json();
		return json
	}
	return null
}

const getBlockedUsersIds = async() => {
	const result = await fetch(`/api/users/me/blocks`, {
		method: 'GET'
	});
	let blocks: Array<number> = []
	if (result.status === 200) {
		const json = await result.json();
		for (let i = 0; i < json.length; i++) {
			blocks.push(json[i].user_id);
		}
	}
	return blocks
}

const getBlockedUsers = async() => {
	const result = await fetch(`/api/users/me/blocks`, {
		method: 'GET'
	});
	let blocks: Array<UserBase> = []
	if (result.status === 200) {
		const json = await result.json();
		for (let i = 0; i < json.length; i++) {
			blocks.push({
				id: json[i].user_id,
				username: json[i].username,
				avatar: json[i].avatar,
			});
		}
	}
	return blocks
}

const deleteUserInvitation = async(invitation_id: number) => {
	const result = await fetch(`/api/channels/invitations/${invitation_id}/delete`, {
		method: 'POST'
	});
	if (result.status !== 200) {
		const json = await result.json();
		return json
	}
	return null
}

const changePassword = async(username: string, old_password: string, newPassword:string, confirmPassword:string) => {
	const requestBody = {
		username: username,
		old_password: old_password,
		new_password: newPassword,
		confirm_password: confirmPassword
	}

	const result = await fetch (`/api/users/me`, {
		method: 'PUT',
		headers: {
		  'Content-Type': 'application/json',
		},
		body: JSON.stringify(requestBody),
	});

	if (result.status !== 200) {
		const json = await result.json();
		return json
	}

	return null
}

const changeUsername = async(username: string) => {
	const requestBody = {
		username: username
	}

	const result = await fetch ('/api/users/me', {
		method: 'PUT',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(requestBody)
	});

	if (result.status !== 200){
		const json = await result.json();
		return json
	}

	return null
}

const changeProfilPicture = async (e: React.ChangeEvent<HTMLInputElement>) => {
	const formData = new FormData()
	if (e.target.files) {
		formData.append('file', e.target.files[0])
	}
	const response = await fetch('/api/users/me/avatar', {
		method: 'PUT',
		body: formData
	})
	const data = await response.json()
	return data
}

const updateGameMode = async (mode: number) => {
	const result = await fetch ('/api/users/me/mode', {
		method: 'PUT',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({mode})
	});

	if (result.status !== 200){
		const json = await result.json();
		return json
	}

	return null
}

export {
	getUserInfo,
	searchUsers,
	blockUser,
	getBlockedUsers,
	getBlockedUsersIds,
	unblockUser,
	getUserInvitations,
	deleteUserInvitation,
	getUserById,
	changePassword,
	changeUsername,
	changeProfilPicture,
	updateGameMode
}
