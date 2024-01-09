import { Controller, Get, Put, Request, HttpCode, UseGuards, Body, UseInterceptors, UploadedFile, HttpException, Post, Param, Query } from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthenticatedGuard } from '../auth/auth.guard';
import { UpdateUserDto } from './dto/UpdateUserDto';
import { FileInterceptor } from '@nestjs/platform-express';
import { join } from 'path';
import * as crypto from "crypto";
import { STATIC_PATH } from '../../app.module';
import * as sharp from 'sharp';
import { UserBlockService } from './userblock.service';
import { UserBlock } from './entities/userblock.entity';
import { FriendshipService } from '../friendship/friendship.service';
import { ILike } from 'typeorm';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { ErrorDTO } from '../common/dto/error.dto';
import { UpdateAvatarResultDTO, UpdateUserResponseDTO } from './dto/responses.dto';
import { UserInfoDTO } from '../common/dto/userinfo.dto';
import { SearchUserDto } from './dto/SearchUser.dto';
import { ChatService } from '../../gateway/chat/chat.service';
import { FriendshipStatus } from '../friendship/friendship.entity';
import { GameStatus } from 'src/gateway/game/models/game.class';
import { UserProfile } from './dto/profile.dto';
import { IdParam } from '../common/idparam';
import { GameType } from 'src/gateway/game/models/game.payloads';
import { GameService } from 'src/gateway/game/game.service';

@UseGuards(AuthenticatedGuard)
@Controller('users')
@ApiTags('users')
export class UsersController {
	constructor(
		private readonly usersService: UsersService,
		private readonly blockService: UserBlockService,
		private readonly friendshipService: FriendshipService,
		private readonly chatService: ChatService,
		private readonly gameService: GameService,
		) {}

	@Get('search')
	@HttpCode(200)
	@ApiResponse({status: 200, description: 'List of users', type: UserInfoDTO, isArray: true})
	@ApiResponse({status: 400, description: 'Invalid parameters', type: ErrorDTO})
	@ApiResponse({status: 401, description: 'Unauthorized', type: ErrorDTO})
	async search(@Request() req: any, @Query() dto: SearchUserDto) {
		const users = await this.usersService.findManyBy({username: ILike(`%${dto.username}%`)}, 5, dto.page);
		return users.map((user) => {
			return new UserInfoDTO(user.id, user.username, user.avatar);
		});
	}

	@Get('me')
	@HttpCode(200)
	@ApiResponse({status: 200, description: 'User data', type: UpdateUserResponseDTO})
	@ApiResponse({status: 401, description: 'Unauthorized'})
	async me(@Request() req: any) {
		const user = await this.usersService.findOneBy({id: req.user.id});
		return new UpdateUserResponseDTO(user.id, user.username, user.avatar, user.user_id_42 > 0, user.totp_secret != null, user.prefered_mode, user.created_at);
	}

	@Put('me')
	@HttpCode(200)
	@ApiResponse({status: 200, description: 'User data updated'})
	@ApiResponse({status: 400, description: 'Invalid parameters', type: ErrorDTO})
	@ApiResponse({status: 403, description: 'Invalid password', type: ErrorDTO})
	@ApiResponse({status: 401, description: 'Unauthorized', type: ErrorDTO})
	async updateMe(@Request() req: any, @Body() dto: UpdateUserDto) {
		let data = {};
		const user = await this.usersService.findOneBy({id: req.user.id});
		if (dto.username) {
			const existing = await this.usersService.findOneByUsername(dto.username);
			if (existing && existing.id !== user.id) {
				throw new HttpException("Username already taken", 400);
			}
			data['username'] = dto.username;
		}
		if (dto.new_password || dto.old_password || dto.confirm_password) {
			if (user.user_id_42 != 0) {
				throw new HttpException("Cannot change password", 403);
			}
			if (!dto.old_password || !dto.confirm_password || !dto.new_password) {
				throw new HttpException("Missing parameters", 400);
			}
			if (dto.new_password !== dto.confirm_password) {
				throw new HttpException("Passwords do not match", 400);
			}
			if (!await this.usersService.verifyPassword(user, dto.old_password)) {
				throw new HttpException("Invalid password", 403);
			}
			data['password'] = await this.usersService.hashPassword(dto.new_password);
		}
		if (dto.username || dto.new_password) {
			await this.usersService.update(req.user.id, data);
			req.user.username = dto.username ?? req.user.username;
			if (dto.username) {
				this.chatService.profileUpdate(req.user.id, dto.username, user.avatar);
				this.gameService.updateUserInfo(req.user.id, dto.username, user.avatar);
			}
		}
	}

	@Put('me/mode')
	@HttpCode(200)
	@ApiResponse({status: 200, description: 'User mode updated'})
	@ApiResponse({status: 400, description: 'Invalid parameters', type: ErrorDTO})
	@ApiResponse({status: 401, description: 'Unauthorized', type: ErrorDTO})
	async updateMode(@Request() req: any, @Body() dto: {mode: number}) {
		if (dto.mode != GameType.CLASSIC && dto.mode != GameType.POWERUPS) {
			throw new HttpException("Invalid mode", 400);
		}
		await this.usersService.update(req.user.id, {prefered_mode: dto.mode});
	}

	@Put('me/avatar')
	@HttpCode(200)
	@UseInterceptors(
		FileInterceptor('file', {
		  limits: {
			fileSize: 5 * 1024 * 1024, // 5MB
		  },
		}),
	)
	@ApiResponse({status: 200, description: 'Avatar updated', type: UpdateAvatarResultDTO})
	@ApiResponse({status: 400, description: 'Invalid parameters', type: ErrorDTO})
	@ApiResponse({status: 401, description: 'Unauthorized', type: ErrorDTO})
	async updateAvatar(@Request() req: any, @UploadedFile() file: Express.Multer.File)
	{
		if (!file || !file.mimetype.startsWith('image/')) {
			throw new HttpException("File is not an image", 400);
		}
		const sha = crypto.createHash('sha1');
		sha.update(file.buffer);
		const hash = sha.digest('hex');
		const fileName = `${hash}.webp`;
		await sharp(file.buffer)
			.resize(400, 400)
			.webp({ effort: 3 })
			.toFile(join(STATIC_PATH, 'uploads', fileName));
		const path = '/uploads/' + fileName;
		await this.usersService.update(req.user.id, {avatar: path})
		req.user.avatar = path;
		this.chatService.profileUpdate(req.user.id, req.user.username, path);
		this.gameService.updateUserInfo(req.user.id, req.user.username, path);
		return new UpdateAvatarResultDTO(path);
	}

	@Get('me/blocks')
	@HttpCode(200)
	@ApiResponse({status: 200, description: 'List of blocked users', type: UserInfoDTO, isArray: true})
	@ApiResponse({status: 401, description: 'Unauthorized', type: ErrorDTO})
	async getBlocks(@Request() req: any) {
		const blocks = await this.blockService.getAllForUser(req.user.id);
		return blocks.map((block: UserBlock) => {
			return new UserInfoDTO(block.blocked_user_id, block.blockedUser.username, block.blockedUser.avatar);
		});
	}

	@Post(':id/block')
	@HttpCode(201)
	@ApiResponse({status: 201, description: 'User blocked'})
	@ApiResponse({status: 400, description: 'Invalid parameters', type: ErrorDTO})
	@ApiResponse({status: 403, description: 'Cannot block yourself', type: ErrorDTO})
	@ApiResponse({status: 409, description: 'User already blocked', type: ErrorDTO})
	@ApiResponse({status: 401, description: 'Unauthorized', type: ErrorDTO})
	async blockUser(@Request() req: any, @Param() {id}: IdParam) {
		const user = await this.usersService.findOneBy({id: id});
		if (!user) {
			throw new HttpException('User not found', 404);
		}
		if (user.id === req.user.id) {
			throw new HttpException('Cannot block yourself', 403);
		}
		const blocked = await this.blockService.hasUserBlockedUser(req.user.id, user.id);
		if (blocked) {
			throw new HttpException('User already blocked', 409);
		}
		await this.blockService.create(new UserBlock({
			blocker_user_id: req.user.id,
			blocked_user_id: user.id,
		}));
		await this.friendshipService.deleteFriendshipBetween(req.user.id, user.id);
		this.chatService.friendshipUpdate(req.user.id, user.id, FriendshipStatus.DELETED);
	}

	@Post(':id/unblock')
	@HttpCode(200)
	@ApiResponse({status: 200, description: 'User unblocked'})
	@ApiResponse({status: 400, description: 'Invalid parameters', type: ErrorDTO})
	@ApiResponse({status: 403, description: 'Cannot unblock yourself', type: ErrorDTO})
	@ApiResponse({status: 409, description: 'User not blocked', type: ErrorDTO})
	@ApiResponse({status: 401, description: 'Unauthorized', type: ErrorDTO})
	async unblockUser(@Request() req: any, @Param() {id}: IdParam) {
		const user = await this.usersService.findOneBy({id: id});
		if (!user) {
			throw new HttpException('User not found', 404);
		}
		if (user.id === req.user.id) {
			throw new HttpException('Forbidden', 403);
		}
		const block = await this.blockService.findOneBy({
			blocker_user_id: req.user.id,
			blocked_user_id: user.id,
		});
		if (!block) {
			throw new HttpException('User not blocked', 409);
		}
		await this.blockService.delete(block.id);
	}

	@Get(':id/profile')
	@HttpCode(200)
	@ApiResponse({status: 200, description: 'User profile data', type: UserProfile})
	@ApiResponse({status: 400, description: 'Invalid parameters', type: ErrorDTO})
	@ApiResponse({status: 404, description: 'User not found', type: ErrorDTO})
	@ApiResponse({status: 401, description: 'Unauthorized', type: ErrorDTO})
	async getUserProfile(@Request() req: any, @Param() {id}: IdParam) {
		const user = await this.usersService.findOneBy({id: id});
		if (!user) {
			throw new HttpException('User not found', 404);
		}
		const getStats = this.usersService.getUserStats(user.id);
		const getHistory = this.usersService.getUserGamesHistory(user.id, 1, 10);
		const getAchievements = this.usersService.getUserAchievements(user.id);
		const [stats, history, achievements] = await Promise.all([getStats, getHistory, getAchievements]);
		return new UserProfile(user, stats, history, achievements);
	}

}

