import { Controller, Get, Put, Request, HttpCode, UseGuards, Body, UseInterceptors, UploadedFile, HttpException, Post, Param, Query } from '@nestjs/common';
import { AuthenticatedGuard } from '../auth/auth.guard';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { GamesApiService } from './games.service';
import { GameStatus } from 'src/gateway/game/models/game.class';
import { GameSummaryResponse } from './dto/summary.response';
import { GameHistoryResponse } from './dto/history.response';
import { LeaderboardEntry } from './dto/leadboard.response';
import { ErrorDTO } from '../common/dto/error.dto';
import { GameService } from 'src/gateway/game/game.service';
import { UsersService } from '../users/users.service';
import { GameInviteUserDto } from './dto/invite.dto';
import { UserBlockService } from '../users/userblock.service';
import { IdParam } from '../common/idparam';

@UseGuards(AuthenticatedGuard)
@Controller('games')
@ApiTags('games')
export class GamesController {
	constructor(
		private readonly gamesApiService: GamesApiService,
		private readonly gameService: GameService,
		private readonly userService: UsersService,
		private readonly userBlockService: UserBlockService,
	) {}

	@Get(':id/summary')
	@ApiResponse({status: 200, description: 'Game summary data', type: GameSummaryResponse})
	@ApiResponse({status: 404, description: 'Game not found', type: ErrorDTO})
	@ApiResponse({status: 401, description: 'Unauthorized', type: ErrorDTO})
	async getGame(@Request() req: any, @Param() {id}: IdParam) {
		const game = await this.gamesApiService.findGameById(id);
		if (!game || game.status !== GameStatus.Finished) {
			throw new HttpException('Game not found', 404);
		}
		if (game.player1.id != req.user.id && game.player2.id != req.user.id) {
			throw new HttpException('Game not found', 404);
		}
		const stats = await this.gamesApiService.findGameStatsById(id);
		const achievements = await this.gamesApiService.findUserAchievementsForGame(req.user.id, id);
		return new GameSummaryResponse(game, stats, achievements);
	}

	@Get('history')
	@ApiResponse({status: 200, description: 'Game history data', type: GameHistoryResponse, isArray: true})
	@ApiResponse({status: 401, description: 'Unauthorized', type: ErrorDTO})
	async getGameHistory(@Request() req: any, @Query('page') page: number = 1, @Query('limit') limit: number = 10) {
		const games = await this.gamesApiService.findGamesByUserId(req.user.id, page, limit);
		return games
			.map(game => new GameHistoryResponse(game));
	}

	@Get('leaderboard')
	@ApiResponse({status: 200, description: 'Leaderboard data', type: LeaderboardEntry, isArray: true})
	@ApiResponse({status: 401, description: 'Unauthorized', type: ErrorDTO})
	async getLeaderboard(@Request() req: any) {
		const stats = await this.gamesApiService.getLeaderBoard(1, 10);
		return stats.map(stat => new LeaderboardEntry(stat));
	}

	@Post('invite')
	@ApiResponse({status: 200, description: 'Invitation sent'})
	@ApiResponse({status: 401, description: 'Unauthorized', type: ErrorDTO})
	@ApiResponse({status: 404, description: 'User not found', type: ErrorDTO})
	@ApiResponse({status: 409, description: 'Error', type: ErrorDTO})
	async inviteUser(@Request() req: any, @Body() dto: GameInviteUserDto) {
		const user = await this.userService.findOneBy({id: dto.user_id});
		const inviter = await this.userService.findOneBy({id: req.user.id});
		if (!user || !inviter) {
			throw new HttpException('User not found', 404);
		}
		if (await this.userBlockService.blocksExistBetweenUsers(req.user.id, user.id)) {
			throw new HttpException('You cannot invite this user', 409);
		}
		const response = await this.gameService.invitePlayer(req.user, user.id, inviter.prefered_mode);
		if (response.error) {
			throw new HttpException(response.error, 409);
		}
		return response;
	}
}

