import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Friend } from './models/Friend';
import { Channel } from './models/Channel';
import { User } from './models/User';
import { Request } from './models/Requests'

type UserContextType = {
  user: User | null;
  setUser: (user: User | null) => void;
  friends: Array<Friend>;
  setFriends: (friends: Array<Friend>) => void;
  requests: Array<Request>;
  setRequests: (requests: Array<Request>) => void;
  channels: Array<Channel>;
  setChannels: (channels: Array<Channel>) => void;
  blockedUsers: Array<number>;
  setBlockedUsers: (blockedUsers: Array<number>) => void;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export function useUserContext() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUserContext must be used within a UserProvider');
  }
  return context;
}


export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [friends, setFriends] = useState<Array<Friend>>([]);
  const [requests, setRequests] = useState<Array<Request>>([]);
  const [channels, setChannels] = useState<Array<Channel>>([]);
  const [blockedUsers, setBlockedUsers] = useState<Array<number>>([]);
  return (
    <UserContext.Provider value={{
      user,
      setUser,
      friends,
      setFriends,
      requests,
      setRequests,
      channels,
      setChannels,
      blockedUsers,
      setBlockedUsers}}>
      {children}
    </UserContext.Provider>
  );
}
