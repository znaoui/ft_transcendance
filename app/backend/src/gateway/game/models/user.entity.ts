import { Socket } from 'socket.io';

export type User = {
	socket: Socket;
	user_id: number;
	username: string;
	avatar: string;
}
