import { Socket } from 'socket.io';
import { ChannelUserRole } from 'src/api/channels/entities/channel_user.entity';

export type ChatUser = {
	user: any;
	sockets: Map<string, Socket>;
	friendships: Array<number>;
	muted_until: number;
}

export type ChannelUser = {
	user_id: number;
	role: ChannelUserRole;
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
