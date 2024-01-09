import { useEffect } from 'react';
import { Socket } from 'socket.io-client';

function useSocketEvents(chatSocket: Socket, events: { event: string, handler: (...args: any[]) => void }[]) {
  useEffect(() => {
    events.forEach(({ event, handler }) => {
      chatSocket.on(event, handler);
    });

    return () => {
      events.forEach(({ event, handler }) => {
        chatSocket.off(event, handler);
      });
    };
  }, [chatSocket, events]);
}

export default useSocketEvents;
