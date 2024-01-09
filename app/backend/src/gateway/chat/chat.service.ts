import { Injectable, Logger } from '@nestjs/common';
import { ChannelUpdateType, ChatUser } from './models/chatuser';
import { ChannelUserRole } from '../../api/channels/entities/channel_user.entity';
import { FriendshipService } from '../../api/friendship/friendship.service';
import { FriendshipStatus } from '../../api/friendship/friendship.entity';
import * as Lock from 'async-lock';
import { ChannelMessageData, ChannelMessageType, PrivateMessage, PrivateMessageData, PrivateMessageResponse, PrivateMessageType } from './models/message.entity';
import { ChatResponse } from './models/chatresponse';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ChannelService } from '../../api/channels/channel.service';
import { ChannelMessage } from './models/chatmessage.entity';
import { Socket } from 'socket.io';
import { ChannelInvitation } from 'src/api/channels/entities/channel_invitation.entity';
import { Channel } from 'src/api/channels/entities/channel.entity';
import { PresenceService } from '../common/presence.service';
import { PresenceStatus } from '../common/models/presence.status';

@Injectable()
export class ChatService {
  private readonly clients: Map<number, ChatUser> = new Map();
  private readonly channels: Map<number, Map<number, number>> = new Map();
  private readonly connectionLock: Lock = new Lock();
  private readonly logger = new Logger("ChatService");

  constructor(
    private readonly friendshipService: FriendshipService,
    private readonly channelService: ChannelService,
    private readonly presenceService: PresenceService,
    @InjectRepository(PrivateMessage)
    private readonly messagesRepository: Repository<PrivateMessage>,
    @InjectRepository(ChannelMessage)
    private readonly channelMessagesRepository: Repository<ChannelMessage>
  ) {
    this.presenceService.onPresenceChange = async (userId, status, fromGameService) => {
      await this.connectionLock.acquire(userId, async () => {
        const client = this.clients.get(userId);
        if (client) {
          if (fromGameService && status === PresenceStatus.OFFLINE) {
            this.presenceService.setPresence(userId, PresenceStatus.ONLINE);
            return;
          }
          this.sendPresenceUpdateToFriends(client, status);
          if (status === PresenceStatus.OFFLINE) {
            this.clients.delete(userId);
          }
        }
      });
    };
  }

  async handleConnection(socket: any) : Promise<void> {
    if (!socket.request.user) {
      socket.disconnect();
      return;
    }
    this.logger.log(`User ${socket.request.user.id} connected`);
    const client = await this.insertClient(socket);
    if (client.friendships.length === 0) {
      this.loadFriends(client.user.id).then(() => {
        this.presenceService.setPresence(client.user.id, PresenceStatus.ONLINE);
      });
    }
    this.loadChannels(client.user.id);
  }

  async handleDisconnect(socket: any): Promise<void> {
    this.logger.log(`User ${socket.request.user.id} disconnected`);
    await this.connectionLock.acquire(socket.request.user.id, async () => {
      const client = this.clients.get(socket.request.user.id);
      if (client.sockets.size > 1) {
        client.sockets.delete(socket.id);
      } else {
        await this.presenceService.setPresence(socket.request.user.id, PresenceStatus.OFFLINE);
      }
    });
  }

  async friendshipRequest(friendship_id: number, sender: any, receiver: any): Promise<void> {
    const client = this.clients.get(receiver.id);
    if (client) {
      client.friendships.push(sender.id);
      client.sockets.forEach(socket => {
        socket.emit('friendship_request', {
          id: friendship_id,
          user_id: sender.id,
          username: sender.username,
          avatar: sender.avatar,
          sender_id: sender.id,
        });
      });
    }
    const senderClient = this.clients.get(sender.id);
    if (senderClient) {
      senderClient.sockets.forEach(socket => {
        socket.emit('friendship_request', {
          id: friendship_id,
          user_id: receiver.id,
          username: receiver.username,
          avatar: receiver.avatar,
          sender_id: sender.id,
        });
      });
    }
  }

  async friendshipUpdate(user_id: number, friend_id: number, status: FriendshipStatus): Promise<void> {
    const client = this.clients.get(user_id);
    if (!client) {
      return;
    }
    const payload = {user_id, status};
    if (status === FriendshipStatus.ACCEPTED) {
      client.friendships.push(friend_id);
      payload['presence'] = await this.presenceService.getPresence(friend_id);
    } else {
      client.friendships = client.friendships.filter(id => id !== friend_id);
    }
    const friend = this.clients.get(friend_id);
    if (friend) {
      if (status === FriendshipStatus.ACCEPTED) {
        friend.friendships.push(user_id);
      } else {
        friend.friendships = friend.friendships.filter(id => id !== user_id);
      }
    }
    this.emitToUser(friend_id, 'friendship_update', payload);
    payload['user_id'] = friend_id;
    this.emitToUser(user_id, 'friendship_update', payload);
  }

  async userJoinedChannel(channel_id: number, channel_type: number, name: string, user: any, role: ChannelUserRole): Promise<void> {
    const channel = this.channels.get(channel_id);
    if (!channel) {
      this.channels.set(channel_id, new Map([[user.id, role]]));
    } else {
      channel.set(user.id, role);
    }
    const client = this.clients.get(user.id);
    if (client) {
      client.sockets.forEach(socket => {
        socket.emit('channel_update', {
          type: ChannelUpdateType.JOINED,
          channel_type: channel_type,
          name: name,
          channel_id: channel_id,
          role: role
        });
      });
    }
    await this.emitChannelEvent(channel_id, 'joined the channel', user);
  }

  async userLeftChannel(channel_id: number, user: any): Promise<void> {
    const channel = this.channels.get(channel_id);
    if (!channel) {
      return;
    }
    channel.delete(user.id);
    const client = this.clients.get(user.id);
    if (client) {
      client.sockets.forEach(socket => {
        socket.emit('channel_update', {
          type: ChannelUpdateType.LEFT,
          channel_id: channel_id,
        });
      });
    }
    await this.emitChannelEvent(channel_id, 'left the channel', user);
  }

  async userKicked(channel_id: number, kicked_user: any, admin_user: any): Promise<void> {
    const channel = this.channels.get(channel_id);
    if (!channel) {
      return;
    }
    channel.delete(kicked_user);
    const client = this.clients.get(kicked_user.id);
    if (client) {
      client.sockets.forEach(socket => {
        socket.emit('channel_update', {
          type: ChannelUpdateType.KICKED,
          channel_id: channel_id,
        });
      });
    }
    await this.emitChannelEvent(channel_id, `has been kicked by ${admin_user.username}`, kicked_user);
  }

  async userBanned(channel_id: number, banned_user: any, admin_user: any): Promise<void> {
    const channel = this.channels.get(channel_id);
    if (!channel) {
      return;
    }
    channel.delete(banned_user.id);
    const client = this.clients.get(banned_user.id);
    if (client) {
      client.sockets.forEach(socket => {
        socket.emit('channel_update', {
          type: ChannelUpdateType.BANNED,
          channel_id: channel_id,
        });
      });
    }
    await this.emitChannelEvent(channel_id, `has been banned by ${admin_user.username}`, banned_user);
  }

  async userMuted(channel_id: number, muted_user: any, admin_user: any, until: Date): Promise<void> {
    const channel = this.channels.get(channel_id);
    if (!channel) {
      return;
    }
    await this.emitChannelEvent(channel_id, `has been muted by ${admin_user.username} until ${until.toLocaleString()}`, muted_user);
    const client = this.clients.get(muted_user.id);
    if (client) {
      client.muted_until = until.getTime();
      client.sockets.forEach(socket => {
        socket.emit('channel_update', {
          type: ChannelUpdateType.MUTED,
          channel_id: channel_id,
          until: until.getTime()
        });
      });
    }
  }

  async userUnmuted(channel_id: number, unmuted_user: any, admin_user: any): Promise<void> {
    const channel = this.channels.get(channel_id);
    if (!channel) {
      return;
    }
    await this.emitChannelEvent(channel_id, `has been unmuted by ${admin_user.username}`, unmuted_user);
    const client = this.clients.get(unmuted_user.id);
    if (client) {
      client.muted_until = 0;
      client.sockets.forEach(socket => {
        socket.emit('channel_update', {
          type: ChannelUpdateType.UNMUTED,
          channel_id: channel_id,
        });
      });
    }
  }

  async channelInvitationUpdate(invitation: ChannelInvitation, channel: Channel, deleted: boolean): Promise<void> {
    this.logger.debug(`Handling channel invitation update for channel ${channel.id}`);
    const user = this.clients.get(invitation.user_id);
    if (!user) {
      return;
    }
    if (!deleted) {
      const payload = {
        id: invitation.id,
        channel_id: channel.id,
        channel_name: channel.name,
        channel_type: channel.type
      };
      user.sockets.forEach(socket => {
        socket.emit('channel_invitation', payload);
      });
    } else {
      user.sockets.forEach(socket => {
        socket.emit('channel_invitation', {
          id: invitation.id,
          channel_id: channel.id,
          deleted: true
        });
      });
    }
  }

  async profileUpdate(user_id: number, username: string, avatar: string): Promise<void> {
    const client = this.clients.get(user_id);
    if (!client) {
      return;
    }
    const payload = {user_id: user_id, username: username, avatar: avatar};
    client.friendships.forEach(friend_id => {
      const friend = this.clients.get(friend_id);
      if (friend) {
        friend.sockets.forEach(socket => {
          socket.emit('friend_profile_update', payload);
        });
      }
    });
  }

  async channelUpdate(channel_id: number, type: ChannelUpdateType, data: any, origin: any): Promise<void> {
    this.logger.debug(`Handling channel update for channel ${channel_id}`);
    const channel = this.channels.get(channel_id);
    if (!channel) {
      return;
    }
    if (type === ChannelUpdateType.DELETED) {
      this.channels.delete(channel_id);
    } else if (type === ChannelUpdateType.NAME_CHANGED) {
      if (data.name) {
        this.emitChannelEvent(channel_id, `renamed channel to '${data.name}'`, origin);
      }
      if (data.type) {
        const type = data.type == 0 ? 'Public' : data.type == 1 ? 'Private' : 'Protected';
        this.emitChannelEvent(channel_id, `changed channel type to '${type}'`, origin);
      }
    }
    const payload = {channel_id: channel_id, type, ...data};
    channel.forEach((role, user_id) => {
      const client = this.clients.get(user_id);
      if (client) {
        client.sockets.forEach(socket => {
          socket.emit('channel_update', payload);
        });
      }
    });
  }

  async roleChanged(channel_id: number, user: any, admin: any, new_role: ChannelUserRole): Promise<void> {
    const channel = this.channels.get(channel_id);
    if (!channel) {
      return;
    }
    channel.set(user.id, new_role);
    if (user === admin) {
      return;
    }
    if (new_role === ChannelUserRole.USER) {
      await this.emitChannelEvent(channel_id, `has been demoted to user by ${admin.username}`, user);
    } else if (new_role === ChannelUserRole.ADMIN) {
      await this.emitChannelEvent(channel_id, `has been promoted to admin by ${admin.username}`, user);
    } else if (new_role === ChannelUserRole.OWNER) {
      await this.emitChannelEvent(channel_id, `has been transfered ownership from ${admin.username}`, user);
    }
    const client = this.clients.get(user.id);
    if (client) {
      client.sockets.forEach(socket => {
        socket.emit('channel_update', {
          type: ChannelUpdateType.ROLE_CHANGED,
          channel_id: channel_id,
          role: new_role
        });
      });
    }
  }

  async handlePrivateMessage(socket: any, data: PrivateMessageData) : Promise<ChatResponse> {
    this.logger.debug(`Handling private message from user ${socket.request.user.id} to user ${data.user_id}`);
    if (!data.user_id || !data.content) {
      return new ChatResponse(false, "Invalid request");
    }
    const user_id: number = socket.request.user.id;
    const client = this.clients.get(user_id);
    if (!client || !client.friendships.includes(data.user_id)) {
      if (!await this.friendshipService.findFriendshipBetween(user_id, data.user_id)) {
        return new ChatResponse(false, "You are not friends with this user");
      } else if (client) {
        client.friendships.push(data.user_id);
      }
    }
    const message = await this.messagesRepository.save(new PrivateMessage({
      type: data.type,
      sender_id: user_id,
      receiver_id: data.user_id,
      content: data.content,
    }));
    const chatmsg = {
      id: message.id,
      type: data.type,
      sender_id: user_id,
      receiver_id: data.user_id,
      content: data.content,
      timestamp: message.created_at.getTime()
    };
    const receiver = this.clients.get(data.user_id);
    if (receiver) {
      this.logger.debug(`Emitting private message to user ${data.user_id}`);
      receiver.sockets.forEach(socket => {
        socket.emit('private_message', chatmsg);
      });
    }
    this.emitToAllSessions(socket, client, 'private_message', chatmsg);
    return new PrivateMessageResponse(message.id);
  }

  private async emitToAllSessions(socket: Socket, client: ChatUser, event: string, data: any): Promise<void> {
    client?.sockets.forEach(s => {
      if (s.id !== socket.id) {
        s.emit(event, data);
      }
    });
  }

  private async emitChannelEvent(channel_id: number, event: string, user: any): Promise<void> {
    const channel = this.channels.get(channel_id);
    if (!channel) {
      return;
    }
    const message = await this.channelMessagesRepository.save(new ChannelMessage({
      type: ChannelMessageType.EVENT,
      channel_id: channel_id,
      user_id: user.id,
      user_role: channel.get(user.id) ?? 0,
      content: event
    }));
    const msg = {
      id: message.id,
      type: message.type,
      channel_id: message.channel_id,
      sender: {
        id: user.id,
        username: user.username,
        avatar: user.avatar,
        role: message.user_role
      },
      content: event,
      timestamp: message.created_at.getTime()
    };
    channel.forEach((role, user_id) => {
      const client = this.clients.get(user_id);
      if (client) {
        client.sockets.forEach(socket => {
          socket.emit('channel_message', msg);
        });
      }
    });
  }

  async handleChannelMessage(socket: any, data: ChannelMessageData): Promise<ChatResponse> {
    this.logger.debug(`Handling channel message from user ${socket.request.user.id} to channel ${data.channel_id}`);
    if (!data.channel_id || !data.content || data.type === ChannelMessageType.EVENT) {
      return new ChatResponse(false, "Invalid request");
    }
    const user = socket.request.user;
    let role = null;
    const client = this.clients.get(user.id);
    if (!client || !this.channels.has(data.channel_id) || !this.channels.get(data.channel_id).has(user.id)) {
      const userChannel = await this.channelService.getUserInChannel(data.channel_id, user.id);
      if (!userChannel) {
        return new ChatResponse(false, "You are not in this channel");
      } else {
        if (!this.channels.has(data.channel_id)) {
          this.channels.set(data.channel_id, new Map());
        }
        if (client) {
          this.channels.get(data.channel_id).set(user.id, userChannel.role);
        }
      }
      role = userChannel.role;
    }
    if (client?.muted_until && client?.muted_until > Date.now()) {
      return new ChatResponse(false, "You are muted until " + new Date(client.muted_until).toLocaleString());
    }
    const channel = this.channels.get(data.channel_id);
    role = role ?? channel.get(user.id) ?? 0;
    const message = await this.channelMessagesRepository.save(new ChannelMessage({
      type: data.type,
      channel_id: data.channel_id,
      user_id: user.id,
      user_role: role,
      content: data.content
    }));
    const msg = {
      id: message.id,
      type: data.type,
      channel_id: data.channel_id,
      sender: {
        id: user.id,
        username: user.username,
        avatar: user.avatar,
        role: role
      },
      content: data.content,
      timestamp: message.created_at.getTime()
    };
    this.emitToAllSessions(socket, client, 'channel_message', msg);
    channel.forEach((role, user_id) => {
      if (user_id === user.id) {
        return;
      }
      const client = this.clients.get(user_id);
      if (client) {
        client.sockets.forEach(socket => {
          socket.emit('channel_message', msg);
        });
      }
    });
    return new PrivateMessageResponse(message.id);
  }

  emitToUser(userId: number, event: string, data: any): void {
    const client = this.clients.get(userId);
    if (client) {
      this.logger.debug(`Emitting ${event} to user ${userId}`);
      client.sockets.forEach(socket => {
        socket.emit(event, data);
      });
    }
  }

  private async insertClient(socket: any): Promise<ChatUser> {
    return await this.connectionLock.acquire(socket.request.user.id, () => {
      let client: ChatUser;
      if (this.clients.has(socket.request.user.id)) {
        client = this.clients.get(socket.request.user.id);
        client.sockets.set(socket.id, socket);
      } else {
         client = {
          user: socket.request.user,
          sockets: new Map([[socket.id, socket]]),
          friendships: [],
          muted_until: 0,
        };
        this.clients.set(socket.request.user.id, client);
        this.presenceService.setPresence(socket.request.user.id, PresenceStatus.ONLINE);
      }
      return client;
    });
  }

  private async sendPresenceUpdateToFriends(user: ChatUser, presence: PresenceStatus): Promise<void> {
    this.logger.debug(`Sending presence update to friends of user ${user.user.id}: ${presence}`);
    user.friendships.forEach(friendId => {
      const friend = this.clients.get(friendId);
      if (friend) {
        friend.sockets.forEach(socket => {
          socket.emit('presence_update', {
            user_id: user.user.id,
            status: presence
          });
        });
      }
    });
  }

  private async loadFriends(userId: number): Promise<void> {
    this.logger.debug(`Loading friends for user ${userId}`);
    const client = this.clients.get(userId);
    (await this.friendshipService.getAllForUser(userId))?.forEach(friendship => {
      if (friendship.status !== FriendshipStatus.ACCEPTED) {
        return;
      }
      const friend_id = friendship.sender_id === client.user.id ? friendship.receiver_id: friendship.sender_id;
      const friend = this.clients.get(friend_id);
      if (this.clients.has(friend_id)) {
        client.friendships.push(friend_id);
        if (!friend.friendships.includes(userId)) {
          this.clients.get(friend_id).friendships.push(userId);
        }
      }
    });
  }

  private async loadChannels(userId: number): Promise<void> {
    this.logger.debug(`Loading channels for user ${userId}`);
    const client = this.clients.get(userId);
    (await this.channelService.getAllChannelsForUser(userId))?.forEach(async r => {
      if (!this.channels.has(r.channel.id)) {
        this.channels.set(r.channel.id, new Map());
      }
      this.channels.get(r.channel.id).set(userId, r.role);
      const mute = await this.channelService.getChannelMute(r.channel.id, userId);
      if (mute) {
        client.muted_until = mute.muted_until.getTime();
        client.sockets.forEach(socket => {
          socket.emit('channel_update', {
            type: ChannelUpdateType.MUTED,
            channel_id: r.channel.id,
            until: client.muted_until
          });
        });
      }
    });
  }
}
