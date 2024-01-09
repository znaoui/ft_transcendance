import { io } from 'socket.io-client';

const URL: string  = '/game';

export const gameSocket = io(URL, { autoConnect: false, withCredentials: true });
