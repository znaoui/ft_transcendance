import { atom } from 'recoil';
import { ChannelMessage, PrivateMessage } from '../../models/Message';

export const messagesState = atom({
  key: 'messagesState',
  default: Array<PrivateMessage>(),
});

export const channelMessagesState = atom({
  key: 'channelMessagesState',
  default: Array<ChannelMessage>(),
});
