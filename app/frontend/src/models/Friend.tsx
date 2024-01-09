export interface Friend {
	id: number;
	user_id: number;
	username: string;
	avatar: string;
	hasUnread: boolean;
	presence: PresenceStatus,
}

export interface FriendshipRequest extends Friend {
	sender_id: number;
	sent: Date;
}

export type PresenceUpdate = {
	user_id: number;
	status: PresenceStatus;
}

export enum PresenceStatus {
	OFFLINE,
	ONLINE,
	IN_GAME,
}

export type FriendshipUpdate = {
	user_id: number;
	status: FriendshipStatus;
	presence: PresenceStatus;
}

export enum FriendshipStatus {
	ACCEPTED = 1,
	REJECTED = 2,
	DELETED = 3,
}
