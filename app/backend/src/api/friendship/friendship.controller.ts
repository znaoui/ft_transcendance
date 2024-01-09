import { Body, Request, Controller, HttpCode, HttpException, Post, UseGuards, Param, Put, Get, Inject, forwardRef, Query} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { AuthenticatedGuard } from '../auth/auth.guard';
import { FriendshipService } from './friendship.service';
import { AddFriendResponseDto } from './dto/AddFriendDto';
import { Friendship, FriendshipStatus } from './friendship.entity';
import { UserBlockService } from '../users/userblock.service';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { ErrorDTO } from '../common/dto/error.dto';
import { FriendshipRequestsResponseDTO, FriendshipResponseDTO, PrivateMessageResponse } from './dto/Friendship.dto';
import { UsernameActionDto } from '../common/dto/useraction.dto';
import { ChatService } from 'src/gateway/chat/chat.service';
import { LimitQueryDto } from '../common/dto/query.dto';
import { stat } from 'fs';
import { User } from '../users/entities/user.entity';
import { PresenceService } from 'src/gateway/common/presence.service';
import { IdParam } from '../common/idparam';

@UseGuards(AuthenticatedGuard)
@Controller('friendships')
@ApiTags('friendships')
export class FriendshipController {
	constructor(
		@Inject(forwardRef(() => UsersService))
		private readonly usersService: UsersService,
		private readonly friendshipService: FriendshipService,
		@Inject(forwardRef(() => UserBlockService))
		private readonly blockService: UserBlockService,
		@Inject(forwardRef(() => ChatService))
		private readonly chatService: ChatService,
		private readonly presenceService: PresenceService,
		) {}

	@Get()
	@HttpCode(200)
	@ApiResponse({status: 200, description: 'List of all friendships', type: FriendshipResponseDTO, isArray: true})
	@ApiResponse({status: 401, description: 'Unauthorized', type: ErrorDTO})
	async getFriendships(@Request() req: any) {
		let friendships = await this.friendshipService.getAllForUser(req.user.id);
		friendships = friendships.filter(async(friendship) => friendship.status == FriendshipStatus.ACCEPTED);
		return await Promise.all(friendships.map(async(friendship) => {
			const friend = friendship.receiver_id === req.user.id ? friendship.sender : friendship.receiver;
			const presence = await this.presenceService.getPresence(friend.id);
			return new FriendshipResponseDTO(friendship.id, friend.id, friend.username, friend.avatar, presence);
		}));
	}

	@Get('/requests')
	@HttpCode(200)
	@ApiResponse({status: 200, description: 'List of all friendship requests', type: FriendshipRequestsResponseDTO, isArray: true})
	@ApiResponse({status: 401, description: 'Unauthorized', type: ErrorDTO})
	async getRequests(@Request() req: any) {
		const friendships = await this.friendshipService.getAllRequestsForUser(req.user.id);
		return friendships
		.filter(friendship => friendship.status !== FriendshipStatus.REJECTED)
		.map(friendship => {
			const friend = friendship.receiver_id === req.user.id ? friendship.sender : friendship.receiver;
			return new FriendshipRequestsResponseDTO(friendship.id, friend.id, friendship.sender.id, friend.username, friend.avatar, friendship.created_at);
		});
	}

	@Get(':id/messages')
	@HttpCode(200)
	@ApiResponse({status: 200, description: 'List of all private messages', type: PrivateMessageResponse, isArray: true})
	@ApiResponse({status: 404, description: 'Friendship not found', type: ErrorDTO})
	@ApiResponse({status: 403, description: 'Cannot access private messages if you are not the sender or receiver', type: ErrorDTO})
	@ApiResponse({status: 401, description: 'Unauthorized', type: ErrorDTO})
	async getPrivateMessages(@Request() req: any, @Query() dto: LimitQueryDto, @Param() {id}: IdParam) {
		const friendship = await this.friendshipService.findOneBy({id: id});
		if (!friendship) {
			throw new HttpException('Friendship not found', 404);
		}
		if (friendship.sender_id !== req.user.id && friendship.receiver_id !== req.user.id) {
			throw new HttpException('Forbidden', 403);
		}
		const messages = await this.friendshipService.getMessages(friendship.sender_id, friendship.receiver_id, 1, dto.limit);
		return messages.map(message => {
			return new PrivateMessageResponse(message);
		});
	}

	@Post('add/:id')
	@HttpCode(201)
	@ApiResponse({status: 201, description: 'Friendship request sent', type: AddFriendResponseDto})
	@ApiResponse({status: 404, description: 'User not found or blocked', type: ErrorDTO})
	@ApiResponse({status: 409, description: 'Friendship already exists', type: ErrorDTO})
	@ApiResponse({status: 401, description: 'Unauthorized', type: ErrorDTO})
	async addFriendById(@Request() req: any, @Param() {id}: IdParam) {
		const friend = await this.usersService.findOneBy({id});
		if (!friend || friend.id === req.user.id) {
			throw new HttpException('User not found', 404);
		}
		return await this.addFriend(req.user, friend);
	}

	@Post('add')
	@HttpCode(201)
	@ApiResponse({status: 201, description: 'Friendship request sent', type: AddFriendResponseDto})
	@ApiResponse({status: 404, description: 'User not found or blocked', type: ErrorDTO})
	@ApiResponse({status: 409, description: 'Friendship already exists', type: ErrorDTO})
	@ApiResponse({status: 401, description: 'Unauthorized', type: ErrorDTO})
	async addFriendByUsername(@Request() req: any, @Body() dto: UsernameActionDto) {
		const friend = await this.usersService.findOneByUsername(dto.username);
		if (!friend || friend.id === req.user.id) {
			throw new HttpException('User not found', 404);
		}
		return await this.addFriend(req.user, friend);
	}

	async addFriend(user: any, friend: User) {
		const blocked = await this.blockService.blocksExistBetweenUsers(user.id, friend.id);
		if (blocked) {
			throw new HttpException('User not found', 404);
		}
		let friendship = await this.friendshipService.findFriendshipBetween(user.id, friend.id);
		if (friendship) {
			if (friendship.status == FriendshipStatus.ACCEPTED) {
				throw new HttpException('Friendship already exists', 409);
			} else if (friendship.status == FriendshipStatus.PENDING) {
				throw new HttpException('Friendship request already exists', 409);
			} else {
				await this.friendshipService.update(friendship.id, {status: FriendshipStatus.PENDING});
			}
		}
		else
		{
			friendship = await this.friendshipService.create(new Friendship({
				sender_id: user.id,
				receiver_id: friend.id,
				status: FriendshipStatus.PENDING,
			}));
		}
		this.chatService.friendshipRequest(friendship.id, user, friend);
		return new AddFriendResponseDto(friendship.id, friend.id, user.id, friend.username, friend.avatar);
	}

	@Put(':id/accept')
	@HttpCode(200)
	@ApiResponse({status: 200, description: 'Friendship accepted', type: FriendshipResponseDTO})
	@ApiResponse({status: 403, description: 'Cannot accept friendship request if you are not the receiver', type: ErrorDTO})
	@ApiResponse({status: 404, description: 'Friendship request not found', type: ErrorDTO})
	@ApiResponse({status: 409, description: 'Friendship request not pending', type: ErrorDTO})
	@ApiResponse({status: 401, description: 'Unauthorized', type: ErrorDTO})
	async acceptFriendship(@Request() req: any, @Param() {id}: IdParam) {
		const friendship = await this.friendshipService.findOneBy({id: id});
		if (!friendship) {
			throw new HttpException('Friendship not found', 404);
		}
		if (friendship.receiver_id !== req.user.id) {
			throw new HttpException('Forbidden', 403);
		}
		if (friendship.status !== FriendshipStatus.PENDING) {
			throw new HttpException('Friendship not pending', 409);
		}
		await this.friendshipService.update(id, {status: FriendshipStatus.ACCEPTED});
		const friend = friendship.sender_id === req.user.id ? friendship.receiver : friendship.sender;
		this.chatService.friendshipUpdate(
			req.user.id,
			friend.id,
			FriendshipStatus.ACCEPTED,
		);
		const presence = await this.presenceService.getPresence(friend.id);
		return new FriendshipResponseDTO(friendship.id, friend.id, friend.username, friend.avatar, presence);
	}

	@Put(':id/reject')
	@HttpCode(200)
	@ApiResponse({status: 200, description: 'Friendship rejected'})
	@ApiResponse({status: 403, description: 'Cannot reject friendship request if you are not the receiver', type: ErrorDTO})
	@ApiResponse({status: 404, description: 'Friendship request not found', type: ErrorDTO})
	@ApiResponse({status: 409, description: 'Friendship request not pending', type: ErrorDTO})
	@ApiResponse({status: 401, description: 'Unauthorized', type: ErrorDTO})
	async rejectFriendship(@Request() req: any, @Param() {id}: IdParam) {
		const friendship = await this.friendshipService.findOneBy({id: id});
		if (!friendship) {
			throw new HttpException('Friendship not found', 404);
		}
		if (friendship.receiver_id !== req.user.id) {
			throw new HttpException('Forbidden', 403);
		}
		if (friendship.status !== FriendshipStatus.PENDING) {
			throw new HttpException('Friendship not pending', 409);
		}
		await this.friendshipService.update(id, {status: FriendshipStatus.REJECTED});
		const friend = friendship.sender_id === req.user.id ? friendship.receiver : friendship.sender;
		this.chatService.friendshipUpdate(
			req.user.id,
			friend.id,
			FriendshipStatus.REJECTED,
		);
	}

	@Put(':id/delete')
	@HttpCode(200)
	@ApiResponse({status: 200, description: 'Friendship deleted'})
	@ApiResponse({status: 403, description: 'Cannot delete friendship if you are not the sender or receiver', type: ErrorDTO})
	@ApiResponse({status: 404, description: 'Friendship not found', type: ErrorDTO})
	@ApiResponse({status: 401, description: 'Unauthorized', type: ErrorDTO})
	async deleteFriendship(@Request() req: any, @Param() {id}: IdParam) {
		const friendship = await this.friendshipService.findOneBy({id: id});
		if (!friendship) {
			throw new HttpException('Friendship not found', 404);
		}
		if (friendship.sender_id !== req.user.id && friendship.receiver_id !== req.user.id) {
			throw new HttpException('Forbidden', 403);
		}
		await this.friendshipService.delete(id);
		const friend = friendship.sender_id === req.user.id ? friendship.receiver : friendship.sender;
		const status = friendship.status === FriendshipStatus.ACCEPTED ? FriendshipStatus.DELETED : FriendshipStatus.REJECTED;
		this.chatService.friendshipUpdate(
			req.user.id,
			friend.id,
			status,
		);
	}

}

