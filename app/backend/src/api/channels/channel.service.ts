import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, MoreThanOrEqual, Repository, UpdateResult } from 'typeorm';
import { Channel } from './entities/channel.entity';
import { ChannelUser, ChannelUserRole } from './entities/channel_user.entity';
import { ChannelInvitation } from './entities/channel_invitation.entity';
import * as argon2 from 'argon2';
import { ChannelBan } from './entities/channel_ban.entity';
import { ChannelMute } from './entities/channel_mute.entity';
import { ChannelMessage } from 'src/gateway/chat/models/chatmessage.entity';

@Injectable()
export class ChannelService {
  constructor(
    @InjectRepository(Channel)
    private channelRepository: Repository<Channel>,
    @InjectRepository(ChannelUser)
    private channelUserRepository: Repository<ChannelUser>,
    @InjectRepository(ChannelInvitation)
    private channelInvitationRepository: Repository<ChannelInvitation>,
    @InjectRepository(ChannelBan)
    private channelBanRepository: Repository<ChannelBan>,
    @InjectRepository(ChannelMute)
    private channelMuteRepository: Repository<ChannelMute>,
    @InjectRepository(ChannelMessage)
    private channelMessageRepository: Repository<ChannelMessage>,
  ) {}

  async verifyChannelPassword(channel_passowrd: string, input: string): Promise<boolean> {
    return await argon2.verify(channel_passowrd, input);
  }

  async hashChannelPassword(password: string): Promise<string> {
    return await argon2.hash(password);
  }

  async addUser(channel_id: number, user_id: number, role: ChannelUserRole = ChannelUserRole.USER): Promise<ChannelUser> {
    const channelUser = new ChannelUser({
      channel_id,
      user_id,
      role,
    });
    return await this.channelUserRepository.save(channelUser);
  }

  async getChannelMessages(channel_id: number, page: number, perPage: number): Promise<ChannelMessage[]> {
    return await this.channelMessageRepository.find({
      where: {channel_id},
      skip: (page - 1) * perPage,
      take: perPage,
      order: {created_at: 'DESC'}
    });
  }

  async isUserMuted(channel_id: number, muted_user_id: number): Promise<boolean> {
    return await this.getChannelMute(channel_id, muted_user_id) != null;
  }

  async getChannelMute(channel_id: number, muted_user_id: number): Promise<ChannelMute> {
    return await this.channelMuteRepository.findOne({where: {channel_id, muted_user_id, muted_until: MoreThan(new Date())}});
  }

  async createChannelMute(channel_id: number, muted_user_id: number, muted_by_user_id: number, muted_until: Date): Promise<ChannelMute> {
    const mute = new ChannelMute({
      channel_id,
      muted_user_id,
      muted_by_user_id,
      muted_until,
    });
    return await this.channelMuteRepository.save(mute);
  }

  async deleteChannelMute(mute: ChannelMute): Promise<void> {
    await this.channelMuteRepository.delete(mute.id);
  }

  async getAllChannelMutes(channel_id: number, page: number, perPage: number): Promise<ChannelMute[]> {
    return await this.channelMuteRepository.find({where: {channel_id, muted_until: MoreThan(new Date())}, skip: (page - 1) * perPage, take: perPage});
  }

  async isUserBanned(channel_id: number, banned_user_id: number): Promise<boolean> {
    return await this.getChannelBan(channel_id, banned_user_id) != null;
  }

  async getChannelBan(channel_id: number, banned_user_id: number): Promise<ChannelBan> {
    return await this.channelBanRepository.findOne({where: {channel_id, banned_user_id}});
  }

  async getAllChannelBans(channel_id: number, page: number, perPage: number): Promise<ChannelBan[]> {
    return await this.channelBanRepository.find({where: {channel_id}, skip: (page - 1) * perPage, take: perPage});
  }

  async createChannelBan(channel_id: number, banned_user_id: number, banned_by_user_id: number): Promise<ChannelBan> {
    const ban = new ChannelBan({
      channel_id,
      banned_user_id,
      banned_by_user_id,
    });
    return await this.channelBanRepository.save(ban);
  }

  async deleteChannelBan(ban: ChannelBan): Promise<void> {
    await this.channelBanRepository.delete(ban.id);
  }

  async isUserInChannel(channel_id: number, user_id: number): Promise<boolean> {
    return await this.channelUserRepository.findOne({where: {channel_id, user_id}}) != null;
  }

  async createChannelInvitation(channel_id: number, user_id: number, invited_by_user_id: number): Promise<ChannelInvitation> {
    const invitation = new ChannelInvitation({
      channel_id,
      user_id,
      invited_by_user_id,
    });
    return await this.channelInvitationRepository.save(invitation);
  }

  async getChannelInvitations(channel_id: number, page: number, perPage: number): Promise<ChannelInvitation[]> {
    return await this.channelInvitationRepository.find({where: {channel_id}, skip: (page - 1) * perPage, take: perPage});
  }

  async getUserInvitation(channel_id: number, user_id: number): Promise<ChannelInvitation> {
    return await this.channelInvitationRepository.findOne({where: {channel_id, user_id}});
  }

  async getChannelInvitationBy(options: any): Promise<ChannelInvitation> {
    return await this.channelInvitationRepository.findOne({where: options});
  }

  async deleteChannelInvitation(invitation: ChannelInvitation): Promise<void> {
    await this.channelInvitationRepository.delete(invitation.id);
  }

  async getUserInChannel(channel_id: number, user_id: number): Promise<ChannelUser> {
    return await this.channelUserRepository.findOne({where: {channel_id, user_id}});
  }

  async findChannelUsersBy(data: any, page: number, perPage: number): Promise<ChannelUser[]> {
    return await this.channelUserRepository.find({where: data, skip: (page - 1) * perPage, take: perPage});
  }

  async updateChannelUser(id: number, data: any): Promise<UpdateResult> {
    return await this.channelUserRepository.update(id, data);
  }

  async getUserInvitations(user_id: number): Promise<ChannelInvitation[]> {
    return await this.channelInvitationRepository.find({where: {user_id}});
  }

  async updateChannelUserByUserId(channel_id: number, user_id: number, data: any): Promise<UpdateResult> {
    return await this.channelUserRepository.update({channel_id, user_id}, data);
  }

  async deleteChannelUser(channel_id: number, user_id: number): Promise<void> {
    await this.channelUserRepository.delete({channel_id, user_id});
  }

  async getAllChannelsForUser(userId: number) : Promise<{ channel: Channel; role: number }[]> {
    const channelUsers = await this.channelUserRepository
    .createQueryBuilder('channel_user')
    .innerJoinAndSelect('channel_user.channel', 'channel')
    .select(['channel', 'channel_user.role'])
    .where('channel_user.user_id = :userId', { userId })
    .getMany();

    return channelUsers.map(channelUser => ({
      channel: channelUser.channel,
      role: channelUser.role
    }));
  }

  async findChannelByName(name: string): Promise<Channel | null> {
    const channel = await this.channelRepository
      .createQueryBuilder('channel')
      .where('LOWER(channel.name) = :name', { name: name.toLowerCase() })
      .getOne();
    return channel;
  }

  async findChannelBy(options: any): Promise<Channel | null> {
    return this.channelRepository.findOne({where: options});
  }

  async createChannel(channel: Channel): Promise<Channel> {
	return await this.channelRepository.save(channel);
  }

  async updateChannel(id: number, data: any): Promise<UpdateResult> {
	return await this.channelRepository.update(id, data);
  }

  async deleteChannel(id: number): Promise<void> {
    await this.channelRepository.delete(id);
  }

}
