import { Friend, FriendshipRequest, PresenceStatus } from "../models/Friend";
import { PrivateMessage } from "../models/Message";

const getFriends = async () => {
	const response = await fetch("/api/friendships");
	if (!response.ok) {
		return [];
	}
	const friends = Array<Friend>();
	const json = await response.json();
	for (let i = 0; i < json.length; i++) {
		friends.push({
			id: json[i].id,
			user_id: json[i].user_id,
			username: json[i].username,
			avatar: json[i].avatar,
			hasUnread: false,
			presence: json[i].presence,
		});
	}
	return friends;
}

const getFriendRequests = async () => {
	const response = await fetch("/api/friendships/requests");
	if (!response.ok) {
		return [];
	}
	const request = Array<FriendshipRequest>();
	const json = await response.json();
	for (let i = 0; i < json.length; i++) {
		request.push({
			id: json[i].id,
			user_id: json[i].user_id,
			username: json[i].username,
			avatar: json[i].avatar,
			sender_id: json[i].sender_id,
			sent: new Date(json[i].sent),
			hasUnread: false,
			presence: PresenceStatus.OFFLINE,
		});
	}
	return request;
}

const addFriend = async (username: string) => {
	const response = await fetch("/api/friendships/add", {
	method: "POST",
	headers: {
	  "Content-Type": "application/json"
	},
	body: JSON.stringify({username})
  });
	const json = await response.json();
	return json;
}

const addFriendById = async (user_id: number) => {
	const response = await fetch(`/api/friendships/add/${user_id}`, {
	method: "POST",
	headers: {
	  "Content-Type": "application/json"
	},
  });
	const json = await response.json();
	return json;
}

const deleteFriendship = async (friend: Friend) => {
	const response = await fetch(`/api/friendships/${friend.id}/delete`, {
	method: "PUT",
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

const acceptFriendRequest = async (request: FriendshipRequest) => {
	const response = await fetch(`/api/friendships/${request.id}/accept`, {
	method: "PUT",
	headers: {
	  "Content-Type": "application/json"
	},
	body: JSON.stringify({request})
  });
	const json = await response.json();
	return json;
}

const rejectFriendRequest = async (request: FriendshipRequest) => {
	const response = await fetch(`/api/friendships/${request.id}/reject`, {
		method: "PUT",
		headers: {
		  "Content-Type": "application/json"
		},
		body: JSON.stringify({request})
	  });
	  if (!response.ok) {
		const json = await response.json();
		return json;
	  }
	  return null;
}

const getPrivateMessages = async (friendship_ip: number, limit: number,) => {
	const response = await fetch(`/api/friendships/${friendship_ip}/messages?limit=${limit}`);
	if (!response.ok) {
		return [];
	}
	const messages = Array<PrivateMessage>();
	const json = await response.json();
	for (let i = 0; i < json.length; i++) {
		messages.push({
			id: json[i].id,
			type: json[i].type,
			sender_id: json[i].sender_id,
			receiver_id: json[i].receiver_id,
			content: json[i].content,
			timestamp: json[i].timestamp,
		});
	}
	return messages;
}

export {
	addFriend,
	addFriendById,
	getFriends,
	getFriendRequests,
	acceptFriendRequest,
	rejectFriendRequest,
	deleteFriendship,
	getPrivateMessages,
};
