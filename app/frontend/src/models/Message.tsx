import { ChannelUser } from "./User";

export interface PrivateMessage {
	  id: number;
	  type: PrivateMessageType;
	  sender_id: number;
	  receiver_id: number;
	  content: string;
	  timestamp: number;
};

export enum PrivateMessageType {
	MESSAGE = 0,
	GAME_INVITE = 1,
}

export interface ChannelMessage {
	  id: number;
	  type: ChannelMessageType;
	  channel_id: number;
	  sender: ChannelUser;
	  content: string;
	  timestamp: number;
};

export enum ChannelMessageType {
	MESSAGE = 0,
	GAME_INVITE = 1,
	EVENT = 2,
}
