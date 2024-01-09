import { io } from 'socket.io-client';

const URL: string  = '/chat';

export const chatSocket = io(URL, { autoConnect: false, withCredentials: true });

export type ChatResponse = {
	success: boolean;
	error_message?: string;
};
