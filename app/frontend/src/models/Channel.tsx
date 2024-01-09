import { ChannelUser } from "./User";

export type Channel = {
	id: number;
	type: ChannelType;
	name: string;
	role: ChannelRole;
	hasUnread: boolean;
	muted_until: number;
};

export enum ChannelType {
	PUBLIC,
	PRIVATE,
	PROTECTED
}

export enum ChannelRole {
	USER,
	ADMIN,
	OWNER
}

export enum ChannelUpdateType {
	JOINED,
	LEFT,
	DELETED,
	KICKED,
	BANNED,
	MUTED,
	UNMUTED,
	ROLE_CHANGED,
	NAME_CHANGED,
}

export interface ChannelBan extends ChannelUser {
	banned_by: string;
	banned_at: Date;
}

export interface ChannelMute extends ChannelUser {
	muted_by: string;
	until: Date;
}

export interface ChannelInvite {
	id: number;
	user_id: number;
	avatar: string;
	username: string;
	invited_by: string;
	invited_at: Date;
}

export interface ChannelRequest {
	id: number;
	channel_id: number;
	channel_type: ChannelType;
	channel_name: string;
	sent: Date;
}
