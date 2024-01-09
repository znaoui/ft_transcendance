import { ChannelRole } from "./Channel";

export interface UserBase {
	id: number;
	username: string;
	avatar: string;
};

export interface User extends UserBase {
	oauth: boolean;
	has_2fa: boolean;
};

export interface ChannelUser extends UserBase {
	role: ChannelRole;
}

export interface ChangePassModel {
	error: string,
	statusCode: number,
	message: string
}
