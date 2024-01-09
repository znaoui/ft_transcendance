import { Body, Request, Controller, HttpCode, HttpException, Post, UseGuards, Param, Put, Get, Inject, forwardRef, Query} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { AuthenticatedGuard } from '../auth/auth.guard';
import { ChannelService } from './channel.service';
import { CreateChannelDto, CreateChannelResponseDto } from './dto/CreateChannelDto';
import { Channel, ChannelType } from './entities/channel.entity';
import { UpdateChannelDto } from './dto/UpdateChannelDto';
import { ChannelUserResponseDto, JoinChannelByNameDto, JoinChannelDto, JoinedChannelResponseDto, UserChannelResponseDto } from './dto/JoinChannelDto';
import { InvitationResponseDto, InviteUserResponseDto, UserChannelInvitationResponseDto } from './dto/InviteUser.dto';
import { ChannelUserRole } from './entities/channel_user.entity';
import { MuteUserDto, MutedUserResponseDto } from './dto/MuteUserDto';
import { PageQueryDto } from './dto/PageQueryDto';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { ErrorDTO } from '../common/dto/error.dto';
import { UserInfoDTO } from '../common/dto/userinfo.dto';
import { BannedUserDto } from './dto/BanUser.dto';
import { AdminUserResponseDto } from './dto/Admin.dto';
import { UserActionDto, UsernameActionDto } from '../common/dto/useraction.dto';
import { LimitQueryDto } from '../common/dto/query.dto';
import { ChannelMessageResponseDto, MessageSenderDto } from './dto/ChannelMessage.dto';
import { ChatService } from 'src/gateway/chat/chat.service';
import { ChannelUpdateType } from 'src/gateway/chat/models/chatuser';
import { IdParam } from '../common/idparam';

@UseGuards(AuthenticatedGuard)
@Controller('channels')
@ApiTags('channels')
export class ChannelController {
	constructor(
		private readonly channelService: ChannelService,
		@Inject(forwardRef(() => UsersService))
		private readonly usersService: UsersService,
		@Inject(forwardRef(() => ChatService))
		private readonly chatService: ChatService,
		) {}

	@Get()
	@HttpCode(200)
	@ApiResponse({status: 200, description: 'User channels', type: UserChannelResponseDto, isArray: true})
	@ApiResponse({status: 401, description: 'Unauthorized', type: ErrorDTO})
	async getUserChannels(@Request() req: any, @Query() query: PageQueryDto) {
		const list = await this.channelService.getAllChannelsForUser(req.user.id);
		return list?.map(r => {
			return new UserChannelResponseDto(r.channel.id, r.channel.type, r.channel.name , r.role);
		}) ?? [];
	}

	@Post('create')
	@HttpCode(201)
	@ApiResponse({status: 201, description: 'Channel created', type: CreateChannelResponseDto})
	@ApiResponse({status: 409, description: 'Channel already exists', type: ErrorDTO})
	@ApiResponse({status: 400, description: 'Invalid parameters', type: ErrorDTO})
	@ApiResponse({status: 401, description: 'Unauthorized', type: ErrorDTO})
	async createChannel(@Body() body: CreateChannelDto, @Request() req: any) {
		if (await this.channelService.findChannelByName(body.name))
			throw new HttpException('Channel already exists', 409);
		if (body.type == ChannelType.PROTECTED && !body.password)
			throw new HttpException('Password is required', 400);
		const c = new Channel({
			name: body.name,
			type: body.type,
			owner_id: req.user.id,
			members_count: 1,
		});
		if (body.type == ChannelType.PROTECTED) {
			c.password = await this.channelService.hashChannelPassword(body.password);
		}
		const channel = await this.channelService.createChannel(c);
		await this.channelService.addUser(channel.id, req.user.id, ChannelUserRole.OWNER);
		this.chatService.userJoinedChannel(channel.id, channel.type, channel.name, req.user, ChannelUserRole.OWNER);
		return new CreateChannelResponseDto(channel.id, channel.name, channel.type);
	}

	@Put(':id/update')
	@HttpCode(200)
	@ApiResponse({status: 200, description: 'Channel updated', type: CreateChannelResponseDto})
	@ApiResponse({status: 404, description: 'Channel not found', type: ErrorDTO})
	@ApiResponse({status: 403, description: 'You are not the channel owner', type: ErrorDTO})
	@ApiResponse({status: 409, description: 'Channel already exists', type: ErrorDTO})
	@ApiResponse({status: 400, description: 'Invalid parameters', type: ErrorDTO})
	async updateChannel(@Request() req: any,  @Param() {id}: IdParam, @Body() body: UpdateChannelDto) {
		if (!body.name && !body.type && !body.password) {
			throw new HttpException('Nothing to update', 400);
		}
		const channel = await this.channelService.findChannelBy({id});
		if (!channel) {
			throw new HttpException('Channel not found', 404);
		}
		if (channel.owner_id != req.user.id) {
			throw new HttpException('You are not the channel owner', 403);
		}
		let data = {};
		if (body.name && body.name != channel.name) {
			if (await this.channelService.findChannelByName(body.name)){
				throw new HttpException('Channel already exists', 409);
			}
			data['name'] = body.name;
		}
		if (body.password && (body.type == ChannelType.PROTECTED || channel.type == ChannelType.PROTECTED)) {
			data['password'] = await this.channelService.hashChannelPassword(body.password);
		}
		if (!body.password && channel.type != ChannelType.PROTECTED && body.type == ChannelType.PROTECTED) {
			throw new HttpException('Password is required', 400);
		}
		if (body.type !== undefined && body.type != channel.type) {
			data['type'] = body.type;
		}
		if (Object.keys(data).length !== 0) {
			await this.channelService.updateChannel(id, data);
			if (data.hasOwnProperty('name') || data.hasOwnProperty('type')) {
				const payload = {name: data["name"], channel_type: data["type"]};
				this.chatService.channelUpdate(channel.id, ChannelUpdateType.NAME_CHANGED, payload, req.user);
			}
		}
		return new CreateChannelResponseDto(channel.id, channel.name, channel.type);
	}

	@Post(':id/delete')
	@HttpCode(200)
	@ApiResponse({status: 200, description: 'Channel deleted'})
	@ApiResponse({status: 404, description: 'Channel not found', type: ErrorDTO})
	@ApiResponse({status: 403, description: 'You are not the channel owner', type: ErrorDTO})
	async deleteChannel(@Request() req: any, @Param() {id}: IdParam) {
		const channel = await this.channelService.findChannelBy({id});
		if (!channel) {
			throw new HttpException('Channel not found', 404);
		}
		if (channel.owner_id != req.user.id) {
			throw new HttpException('You are not the channel owner', 403);
		}
		//cascade deletion will be triggered
		//meaning all channel users, bans, mutes, invitations, messages will be deleted by the database
		await this.channelService.deleteChannel(id);
		this.chatService.channelUpdate(id, ChannelUpdateType.DELETED, {}, req.user);
	}

	@Get(':id/messages')
	@HttpCode(200)
	@ApiResponse({status: 200, description: 'Channel messages', type: ChannelMessageResponseDto, isArray: true})
	@ApiResponse({status: 404, description: 'Channel not found', type: ErrorDTO})
	@ApiResponse({status: 403, description: 'You are not in this channel', type: ErrorDTO})
	@ApiResponse({status: 401, description: 'Unauthorized', type: ErrorDTO})
	async getChannelmessages(@Request() req: any, @Param() {id}: IdParam, @Query() query: LimitQueryDto) {
		const channel = await this.channelService.findChannelBy({id});
		if (!channel) {
			throw new HttpException('Channel not found', 404);
		}
		if (!await this.channelService.isUserInChannel(channel.id, req.user.id)) {
			throw new HttpException('You are not in this channel', 403);
		}
		const list = await this.channelService.getChannelMessages(channel.id, 1, query.limit);
		return list?.map(message => {
			return new ChannelMessageResponseDto(message.id,
				message.channel_id,
				message.type,
				new MessageSenderDto(message.user_id,
					message.user.username,
					message.user.avatar,
					message.user_role),
				message.content,
				message.created_at);
		}) ?? [];
	}

	@Post('join')
	@HttpCode(200)
	@ApiResponse({status: 200, description: 'Channel joined', type: JoinedChannelResponseDto})
	@ApiResponse({status: 404, description: 'Channel not found', type: ErrorDTO})
	@ApiResponse({status: 403, description: 'You are banned from this channel / channel is private / invalid password', type: ErrorDTO})
	@ApiResponse({status: 409, description: 'You are already in this channel', type: ErrorDTO})
	@ApiResponse({status: 400, description: 'Password is required', type: ErrorDTO})
	async joinChannelByName(@Request() req: any, @Body() body: JoinChannelByNameDto) {
		const channel = await this.channelService.findChannelByName(body.name);
		if (!channel) {
			throw new HttpException('Channel not found', 404);
		}
		return await this.joinChannel(req, body, channel);
	}

	@Post(':id/join')
	@HttpCode(200)
	@ApiResponse({status: 200, description: 'Channel joined', type: JoinedChannelResponseDto})
	@ApiResponse({status: 404, description: 'Channel not found', type: ErrorDTO})
	@ApiResponse({status: 403, description: 'You are banned from this channel / channel is private / invalid password', type: ErrorDTO})
	@ApiResponse({status: 409, description: 'You are already in this channel', type: ErrorDTO})
	@ApiResponse({status: 400, description: 'Password is required', type: ErrorDTO})
	async joinChannelById(@Request() req: any, @Body() body: JoinChannelDto, @Param() {id}: IdParam) {
		const channel = await this.channelService.findChannelBy({id});
		if (!channel) {
			throw new HttpException('Channel not found', 404);
		}
		return await this.joinChannel(req, body, channel);
	}

	async joinChannel(@Request() req: any, @Body() body: JoinChannelDto, channel: Channel) {
		if (await this.channelService.isUserBanned(channel.id, req.user.id)) {
			throw new HttpException('You are banned from this channel', 403);
		}
		const user_channel = await this.channelService.getUserInChannel(channel.id, req.user.id);
		if (user_channel) {
				throw new HttpException('You are already in this channel', 409);
		}
		const invitation = await this.channelService.getUserInvitation(channel.id, req.user.id);
		if (channel.type == ChannelType.PRIVATE && !invitation) {
				throw new HttpException('Channel is private', 403);
		} else if (channel.type == ChannelType.PROTECTED) {
			if (!body.password) {
				throw new HttpException('Password is required', 400);
			}
			if (!await this.channelService.verifyChannelPassword(channel.password, body.password)) {
				throw new HttpException('Invalid password', 403);
			}
		}
		if (invitation) {
			await this.channelService.deleteChannelInvitation(invitation);
		}
		await this.channelService.updateChannel(channel.id, {members_count: channel.members_count + 1});
		await this.channelService.addUser(channel.id, req.user.id);
		this.chatService.userJoinedChannel(channel.id, channel.type, channel.name, req.user, ChannelUserRole.USER);
		return new JoinedChannelResponseDto(channel.id, channel.name);
	}

	@Post(':id/leave')
	@HttpCode(200)
	@ApiResponse({status: 200, description: 'Channel left'})
	@ApiResponse({status: 404, description: 'Channel not found', type: ErrorDTO})
	@ApiResponse({status: 403, description: 'You are not in this channel', type: ErrorDTO})
	@ApiResponse({status: 409, description: 'You must transfer ownership before leaving the channel', type: ErrorDTO})
	async leaveChannel(@Request() req: any, @Param() {id}: IdParam) {
		const channel = await this.channelService.findChannelBy({id});
		if (!channel) {
			throw new HttpException('Channel not found', 404);
		}
		if (!await this.channelService.isUserInChannel(channel.id, req.user.id)) {
			throw new HttpException('You are not in this channel', 403);
		}
		if (channel.owner_id === req.user.id && channel.members_count > 1) {
			throw new HttpException('You must transfer ownership before leaving the channel', 409);
		}
		if (channel.members_count == 1) {
			await this.channelService.deleteChannel(id);
		} else {
			await this.channelService.deleteChannelUser(channel.id, req.user.id);
			await this.channelService.updateChannel(channel.id, {members_count: channel.members_count - 1});
			this.chatService.userLeftChannel(channel.id, req.user);
		}
	}

	@Post(':id/ownership/transfer')
	@HttpCode(200)
	@ApiResponse({status: 200, description: 'Channel ownership transferred'})
	@ApiResponse({status: 404, description: 'Channel not found', type: ErrorDTO})
	@ApiResponse({status: 403, description: 'You are not the channel owner / User is not in this channel', type: ErrorDTO})
	@ApiResponse({status: 409, description: 'You cannot transfer ownership to yourself', type: ErrorDTO})
	async transferOwnership(@Request() req: any, @Param() {id}: IdParam, @Body() body: UserActionDto) {
		if (req.user.id == body.user_id) {
			throw new HttpException('You cannot transfer ownership to yourself', 409);
		}
		const channel = await this.channelService.findChannelBy({id});
		if (!channel) {
			throw new HttpException('Channel not found', 404);
		}
		if (channel.owner_id != req.user.id) {
			throw new HttpException('You are not the channel owner', 403);
		}
		const user = await this.channelService.getUserInChannel(channel.id, body.user_id);
		if (!user) {
			throw new HttpException('User is not in this channel', 404);
		}
		await this.channelService.updateChannel(channel.id, {owner_id: body.user_id});
		await this.channelService.updateChannelUserByUserId(channel.id, req.user.id, {role: ChannelUserRole.ADMIN});
		await this.channelService.updateChannelUser(user.id, {role: ChannelUserRole.OWNER});
		this.chatService.roleChanged(channel.id, user.user, req.user, ChannelUserRole.OWNER);
		this.chatService.roleChanged(channel.id, req.user, req.user, ChannelUserRole.ADMIN);
	}

	@Get('/invitations')
	@HttpCode(200)
	@ApiResponse({status: 200, description: 'User invitations', type: UserChannelInvitationResponseDto, isArray: true})
	@ApiResponse({status: 401, description: 'Unauthorized', type: ErrorDTO})
	async getUserInvitations(@Request() req: any, @Query() query: PageQueryDto) {
		const list = await this.channelService.getUserInvitations(req.user.id);
		return list?.map(invitation => {
			return new UserChannelInvitationResponseDto(invitation.id,
				invitation.channel.id,
				invitation.channel.name,
				invitation.channel.type,
				invitation.created_at);
		}) ?? [];
	}

	@Post('/invitations/:id/delete')
	@HttpCode(200)
	@ApiResponse({status: 200, description: 'User invitation deleted'})
	@ApiResponse({status: 404, description: 'Invitation not found', type: ErrorDTO})
	@ApiResponse({status: 401, description: 'Unauthorized', type: ErrorDTO})
	async deleteUserInvitation(@Request() req: any, @Param() {id}: IdParam) {
		const invitation = await this.channelService.getChannelInvitationBy({id, user_id: req.user.id});
		if (!invitation) {
			throw new HttpException('Invitation not found', 404);
		}
		await this.channelService.deleteChannelInvitation(invitation);
	}

	@Post(':id/invite')
	@HttpCode(201)
	@ApiResponse({status: 201, description: 'User invited', type: InviteUserResponseDto})
	@ApiResponse({status: 404, description: 'Channel not found / User not found / Channel is protected', type: ErrorDTO})
	@ApiResponse({status: 403, description: 'You are not an admin', type: ErrorDTO})
	@ApiResponse({status: 409, description: 'User is already in this channel / User is already invited to this channel', type: ErrorDTO})
	async inviteUser(@Request() req: any, @Param() {id}: IdParam, @Body() body: UsernameActionDto) {
		const channel = await this.channelService.findChannelBy({id});
		if (!channel) {
			throw new HttpException('Channel not found', 404);
		}
		if (channel.type === ChannelType.PROTECTED) {
			throw new HttpException('You cannot invite users in a password protected channel', 403);
		}
		const origin_user = await this.channelService.getUserInChannel(channel.id, req.user.id);
		if (!origin_user) {
			throw new HttpException('You are not in this channel', 403);
		}
		if (origin_user.role === ChannelUserRole.USER) {
			throw new HttpException('You are not an admin', 403);
		}
		const user = await this.usersService.findOneByUsername(body.username);
		if (!user) {
			throw new HttpException('User not found', 404);
		}
		if (await this.channelService.isUserInChannel(channel.id, user.id)) {
			throw new HttpException('User is already in this channel', 409);
		}
		if (await this.channelService.isUserBanned(channel.id, user.id)) {
			throw new HttpException('User is banned from this channel', 403);
		}
		if (await this.channelService.getUserInvitation(channel.id, user.id)) {
			throw new HttpException('User is already invited to this channel', 409);
		}
		const invitation = await this.channelService.createChannelInvitation(channel.id, user.id, req.user.id);
		this.chatService.channelInvitationUpdate(invitation, channel, false);
		return new InviteUserResponseDto(invitation.id, user.id, user.username, user.avatar);
	}

	@Get(':id/invitations')
	@HttpCode(200)
	@ApiResponse({status: 200, description: 'Channel invitations', type: InvitationResponseDto, isArray: true})
	@ApiResponse({status: 404, description: 'Channel not found', type: ErrorDTO})
	@ApiResponse({status: 403, description: 'You are not the channel owner', type: ErrorDTO})
	async getChannelInvitations(@Request() req: any, @Param() {id}: IdParam, @Query() query: PageQueryDto) {
		const channel = await this.channelService.findChannelBy({id});
		if (!channel) {
			throw new HttpException('Channel not found', 404);
		}
		if (channel.owner_id != req.user.id) {
			throw new HttpException('You are not the channel owner', 403);
		}
		const list = await this.channelService.getChannelInvitations(channel.id, query.page, 20);
		return list?.map(invitation => {
			return new InvitationResponseDto(invitation.id,
				new UserInfoDTO(invitation.user_id,
					invitation.user.username,
					invitation.user.avatar),
				new UserInfoDTO(invitation.invited_by_user_id,
					invitation.invited_by.username,
					 invitation.invited_by.avatar)
					,invitation.created_at);
		}) ?? [];
	}

	@Post(':id/invitations/:invitation_id/delete')
	@HttpCode(200)
	@ApiResponse({status: 200, description: 'Channel invitation deleted'})
	@ApiResponse({status: 404, description: 'Channel not found / Invitation not found', type: ErrorDTO})
	@ApiResponse({status: 403, description: 'You are not the channel owner', type: ErrorDTO})
	async deleteInvitation(@Request() req: any, @Param() {id}: IdParam, @Param('invitation_id') invitation_id: number) {
		const channel = await this.channelService.findChannelBy({id});
		if (!channel) {
			throw new HttpException('Channel not found', 404);
		}
		if (channel.owner_id != req.user.id) {
			throw new HttpException('You are not the channel owner', 403);
		}
		const invitation = await this.channelService.getChannelInvitationBy({id: invitation_id, channel_id: channel.id});
		if (!invitation) {
			throw new HttpException('Invitation not found', 404);
		}
		await this.channelService.deleteChannelInvitation(invitation);
		this.chatService.channelInvitationUpdate(invitation, channel, true);
	}

	@Post(':id/kick')
	@HttpCode(200)
	@ApiResponse({status: 200, description: 'User kicked'})
	@ApiResponse({status: 404, description: 'Channel not found / User not found / User not in this channel', type: ErrorDTO})
	@ApiResponse({status: 403, description: 'You are not an admin / You cannot kick the channel owner / You are not in this channel', type: ErrorDTO})
	@ApiResponse({status: 409, description: 'You cannot kick yourself', type: ErrorDTO})
	async kickUser(@Request() req: any, @Param() {id}: IdParam, @Body() body: UserActionDto) {
		const channel = await this.channelService.findChannelBy({id});
		if (!channel) {
			throw new HttpException('Channel not found', 404);
		}
		const channel_user = await this.channelService.getUserInChannel(channel.id, req.user.id);
		if (!channel_user) {
			throw new HttpException('You are not in this channel', 403);
		}
		if (channel_user.role === ChannelUserRole.USER) {
			throw new HttpException('You are not an admin', 403);
		}
		if (channel.owner_id == body.user_id) {
			throw new HttpException('You cannot kick the channel owner', 403);
		}
		if (req.user.id == body.user_id) {
			throw new HttpException('You cannot kick yourself', 409);
		}
		const user = await this.channelService.getUserInChannel(channel.id, body.user_id);
		if (!user) {
			throw new HttpException('User is not in this channel', 404);
		}
		await this.channelService.deleteChannelUser(channel.id, body.user_id);
		await this.channelService.updateChannel(channel.id, {members_count: channel.members_count - 1});
		this.chatService.userKicked(channel.id, user.user, req.user);
	}

	@Post(':id/ban')
	@HttpCode(200)
	@ApiResponse({status: 200, description: 'User banned'})
	@ApiResponse({status: 404, description: 'Channel not found / User not found / User not in this channel', type: ErrorDTO})
	@ApiResponse({status: 403, description: 'You are not an admin / You cannot ban the channel owner / You are not in this channel', type: ErrorDTO})
	@ApiResponse({status: 409, description: 'You cannot ban yourself', type: ErrorDTO})
	async banUser(@Request() req: any, @Param() {id}: IdParam, @Body() body: UserActionDto) {
		const channel = await this.channelService.findChannelBy({id});
		if (!channel) {
			throw new HttpException('Channel not found', 404);
		}
		const channel_user = await this.channelService.getUserInChannel(channel.id, req.user.id);
		if (!channel_user) {
			throw new HttpException('You are not in this channel', 403);
		}
		if (channel_user.role === ChannelUserRole.USER) {
			throw new HttpException('You are not an admin', 403);
		}
		if (channel.owner_id == body.user_id) {
			throw new HttpException('You cannot ban the channel owner', 403);
		}
		if (req.user.id == body.user_id) {
			throw new HttpException('You cannot ban yourself', 409);
		}
		const user = await this.channelService.getUserInChannel(channel.id, body.user_id);
		if (!user) {
			throw new HttpException('User is not in this channel', 404);
		}
		await this.channelService.createChannelBan(channel.id, body.user_id, req.user.id);
		await this.channelService.deleteChannelUser(channel.id, body.user_id);
		await this.channelService.updateChannel(channel.id, {members_count: channel.members_count - 1});
		this.chatService.userBanned(channel.id, user.user, req.user);
	}

	@Post(':id/unban')
	@HttpCode(200)
	@ApiResponse({status: 200, description: 'User unbanned'})
	@ApiResponse({status: 404, description: 'Channel not found / User not banned', type: ErrorDTO})
	@ApiResponse({status: 403, description: 'You are not an admin / You are not in this channel', type: ErrorDTO})
	async unbanUser(@Request() req: any, @Param() {id}: IdParam, @Body() body: UserActionDto) {
		const channel = await this.channelService.findChannelBy({id});
		if (!channel) {
			throw new HttpException('Channel not found', 404);
		}
		const channel_user = await this.channelService.getUserInChannel(channel.id, req.user.id);
		if (!channel_user) {
			throw new HttpException('You are not in this channel', 403);
		}
		if (channel_user.role === ChannelUserRole.USER) {
			throw new HttpException('You are not an admin', 403);
		}
		const ban = await this.channelService.getChannelBan(channel.id, body.user_id);
		if (!ban) {
			throw new HttpException('User ban not found', 404);
		}
		await this.channelService.deleteChannelBan(ban);
	}

	@Get(':id/bans')
	@HttpCode(200)
	@ApiResponse({status: 200, description: 'Channel bans', type: BannedUserDto, isArray: true})
	@ApiResponse({status: 404, description: 'Channel not found', type: ErrorDTO})
	@ApiResponse({status: 403, description: 'You are not an admin', type: ErrorDTO})
	async getBannedUsers(@Request() req: any, @Param() {id}: IdParam, @Query() query: PageQueryDto) {
		const channel = await this.channelService.findChannelBy({id});
		if (!channel) {
			throw new HttpException('Channel not found', 404);
		}
		const channel_user = await this.channelService.getUserInChannel(channel.id, req.user.id);
		if (!channel_user) {
			throw new HttpException('You are not in this channel', 403);
		}
		if (channel_user.role === ChannelUserRole.USER) {
			throw new HttpException('You are not an admin', 403);
		}
		const b = await this.channelService.getAllChannelBans(channel.id, query.page, 20);
		return b?.map(ban => {
			return new BannedUserDto(
				new UserInfoDTO(ban.banned_user_id, ban.banned_user.username, ban.banned_user.avatar),
				new UserInfoDTO(ban.banned_by_user_id, ban.banned_by.username, ban.banned_by.avatar),
				ban.created_at,
			);
		}) ?? [];
	}

	@Post(':id/mute')
	@HttpCode(200)
	@ApiResponse({status: 200, description: 'User muted'})
	@ApiResponse({status: 400, description: 'Invalid timestamp', type: ErrorDTO})
	@ApiResponse({status: 409, description: 'User already muted', type: ErrorDTO})
	@ApiResponse({status: 404, description: 'Channel not found / User not found / User not in this channel', type: ErrorDTO})
	@ApiResponse({status: 403, description: 'You are not an admin / You cannot mute the channel owner / You are not in this channel', type: ErrorDTO})
	async muteUser(@Request() req: any, @Param() {id}: IdParam, @Body() body: MuteUserDto) {
		if (body.until < Date.now()) {
			throw new HttpException('Invalid timestamp', 400);
		}
		if (req.user.id == body.user_id) {
			throw new HttpException('You cannot mute yourself', 403);
		}
		const channel = await this.channelService.findChannelBy({id});
		if (!channel) {
			throw new HttpException('Channel not found', 404);
		}
		const channel_user = await this.channelService.getUserInChannel(channel.id, req.user.id);
		if (!channel_user) {
			throw new HttpException('You are not in this channel', 403);
		}
		if (channel_user.role === ChannelUserRole.USER) {
			throw new HttpException('You are not an admin', 403);
		}
		if (channel.owner_id == body.user_id) {
			throw new HttpException('You cannot mute the channel owner', 403);
		}
		const user = await this.channelService.getUserInChannel(channel.id, body.user_id);
		if (!user) {
			throw new HttpException('User is not in this channel', 404);
		}
		const existingMute = await this.channelService.getChannelMute(channel.id, body.user_id);
		if (existingMute) {
			throw new HttpException('User is already muted', 409);
		}
		const until = new Date(body.until);
		await this.channelService.createChannelMute(channel.id, user.user_id, req.user.id, until);
		this.chatService.userMuted(channel.id, user.user, req.user, until);
	}

	@Post(':id/unmute')
	@HttpCode(200)
	@ApiResponse({status: 200, description: 'User unmuted'})
	@ApiResponse({status: 404, description: 'Channel not found / User not muted', type: ErrorDTO})
	@ApiResponse({status: 403, description: 'You are not an admin / You are not in this channel', type: ErrorDTO})
	async unmuteUser(@Request() req: any, @Param() {id}: IdParam, @Body() body: UserActionDto) {
		const channel = await this.channelService.findChannelBy({id});
		if (!channel) {
			throw new HttpException('Channel not found', 404);
		}
		const channel_user = await this.channelService.getUserInChannel(channel.id, req.user.id);
		if (!channel_user) {
			throw new HttpException('You are not in this channel', 403);
		}
		if (channel_user.role === ChannelUserRole.USER) {
			throw new HttpException('You are not an admin', 403);
		}
		const mute = await this.channelService.getChannelMute(channel.id, body.user_id);
		if (!mute) {
			throw new HttpException('Muted user not found', 404);
		}
		await this.channelService.deleteChannelMute(mute);
		this.chatService.userUnmuted(channel.id, mute.muted_user, req.user);
	}

	@Get(':id/muted')
	@HttpCode(200)
	@ApiResponse({status: 200, description: 'Channel mutes', type: MutedUserResponseDto, isArray: true})
	@ApiResponse({status: 404, description: 'Channel not found', type: ErrorDTO})
	@ApiResponse({status: 403, description: 'You are not an admin', type: ErrorDTO})
	async getMutedUsers(@Request() req: any, @Param() {id}: IdParam, @Query() query: PageQueryDto) {
		const channel = await this.channelService.findChannelBy({id});
		if (!channel) {
			throw new HttpException('Channel not found', 404);
		}
		const channel_user = await this.channelService.getUserInChannel(channel.id, req.user.id);
		if (!channel_user) {
			throw new HttpException('You are not in this channel', 403);
		}
		if (channel_user.role === ChannelUserRole.USER) {
			throw new HttpException('You are not an admin', 403);
		}
		const mutes = await this.channelService.getAllChannelMutes(channel.id, query.page, 20);
		return mutes?.map(mute => {
			return new MutedUserResponseDto(
				new UserInfoDTO(mute.muted_user_id, mute.muted_user.username, mute.muted_user.avatar),
				new UserInfoDTO(mute.muted_by_user_id, mute.muted_by.username, mute.muted_by.avatar),
				mute.muted_until,
				mute.created_at,
			);
		}) ?? [];
	}

	@Post(':id/admin/add')
	@HttpCode(200)
	@ApiResponse({status: 200, description: 'User added as admin'})
	@ApiResponse({status: 404, description: 'Channel not found / User not found / User not in this channel', type: ErrorDTO})
	@ApiResponse({status: 403, description: 'You are not the channel owner / You are not in this channel', type: ErrorDTO})
	@ApiResponse({status: 409, description: 'User is already an admin / You cannot add yourself as an admin', type: ErrorDTO})
	async addAdmin(@Request() req: any, @Param() {id}: IdParam, @Body() body: UserActionDto) {
		if (req.user.id == body.user_id) {
			throw new HttpException('You cannot add yourself as an admin', 409);
		}
		const channel = await this.channelService.findChannelBy({id});
		if (!channel) {
			throw new HttpException('Channel not found', 404);
		}
		const channel_user = await this.channelService.getUserInChannel(channel.id, req.user.id);
		if (!channel_user) {
			throw new HttpException('You are not in this channel', 403);
		}
		if (channel.owner_id != req.user.id) {
			throw new HttpException('You are not the channel owner', 403);
		}
		const user = await this.channelService.getUserInChannel(channel.id, body.user_id);
		if (!user) {
			throw new HttpException('User is not in this channel', 404);
		} else if (user.role !== ChannelUserRole.USER) {
			throw new HttpException('User is already an admin', 409);
		}
		await this.channelService.updateChannelUser(user.id, {role: ChannelUserRole.ADMIN});
		this.chatService.roleChanged(channel.id, user.user, req.user, ChannelUserRole.ADMIN);
	}

	@Post(':id/admin/remove')
	@HttpCode(200)
	@ApiResponse({status: 200, description: 'User removed as admin'})
	@ApiResponse({status: 404, description: 'Channel not found / User not found / User not in this channel', type: ErrorDTO})
	@ApiResponse({status: 403, description: 'You are not the channel owner / You are not in this channel', type: ErrorDTO})
	@ApiResponse({status: 409, description: 'User is not an admin / You cannot remove yourself as an admin', type: ErrorDTO})
	async removeAdmin(@Request() req: any, @Param() {id}: IdParam, @Body() body: UserActionDto) {
		if(req.user.id == body.user_id) {
			throw new HttpException('You cannot remove yourself as an admin', 409);
		}
		const channel = await this.channelService.findChannelBy({id});
		if (!channel) {
			throw new HttpException('Channel not found', 404);
		}
		const channel_user = await this.channelService.getUserInChannel(channel.id, req.user.id);
		if (!channel_user) {
			throw new HttpException('You are not in this channel', 403);
		}
		if (channel.owner_id != req.user.id) {
			throw new HttpException('You are not the channel owner', 403);
		}
		const user = await this.channelService.getUserInChannel(channel.id, body.user_id);
		if (!user) {
			throw new HttpException('User is not in this channel', 404);
		} else if (user.role === ChannelUserRole.USER) {
			throw new HttpException('User is not an admin', 409);
		}
		await this.channelService.updateChannelUser(user.id, {role: ChannelUserRole.USER});
		this.chatService.roleChanged(channel.id, user.user, req.user, ChannelUserRole.USER);
	}

	@Get(':id/admins')
	@HttpCode(200)
	@ApiResponse({status: 200, description: 'Channel admins', type: AdminUserResponseDto, isArray: true})
	@ApiResponse({status: 404, description: 'Channel not found', type: ErrorDTO})
	@ApiResponse({status: 403, description: 'You are not an admin', type: ErrorDTO})
	async getAdmins(@Request() req: any, @Param() {id}: IdParam, @Query() query: PageQueryDto) {
		const channel = await this.channelService.findChannelBy({id});
		if (!channel) {
			throw new HttpException('Channel not found', 404);
		}
		const channel_user = await this.channelService.getUserInChannel(channel.id, req.user.id);
		if (!channel_user) {
			throw new HttpException('You are not in this channel', 403);
		}
		if (channel_user.role === ChannelUserRole.USER) {
			throw new HttpException('You are not an admin', 403);
		}
		const users = await this.channelService.findChannelUsersBy({channel_id: channel.id, role: [ChannelUserRole.ADMIN, ChannelUserRole.OWNER]}, query.page, 20);
		return users?.map(user => {
			return new AdminUserResponseDto(user.user_id, user.user.username, user.user.avatar, user.user_id == channel.owner_id);
		}) ?? [];
	}

	@Get(':id/users')
	@HttpCode(200)
	@ApiResponse({status: 200, description: 'Channel users', type: ChannelUserResponseDto, isArray: true})
	@ApiResponse({status: 404, description: 'Channel not found', type: ErrorDTO})
	@ApiResponse({status: 403, description: 'You are not in this channel', type: ErrorDTO})
	async getChannelUsers(@Request() req: any, @Param() {id}: IdParam, @Query() query: PageQueryDto) {
		const channel = await this.channelService.findChannelBy({id});
		if (!channel) {
			throw new HttpException('Channel not found', 404);
		}
		const channel_user = await this.channelService.getUserInChannel(channel.id, req.user.id);
		if (!channel_user) {
			throw new HttpException('You are not in this channel', 403);
		}
		const list = await this.channelService.findChannelUsersBy({channel_id: channel.id}, query.page, 20);
		return list?.map(user => {
				return new ChannelUserResponseDto(user.user_id, user.user.username, user.user.avatar, user.role, user.created_at);
		}) ?? [];
	}

}

