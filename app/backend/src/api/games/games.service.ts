import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Game } from 'src/gateway/game/models/game.entity';
import { GameStats } from 'src/gateway/game/models/gamestats.entity';
import { Repository, } from 'typeorm';
import { UserAchievement } from '../users/entities/userachievement.entity';
import { UserStats } from '../users/entities/userstats.entity';
import { GameStatus } from 'src/gateway/game/models/game.class';

@Injectable()
export class GamesApiService {
  constructor(
    @InjectRepository(Game)
    private gamesRepository: Repository<Game>,
	@InjectRepository(GameStats)
	private gameStatsRepository: Repository<GameStats>,
	@InjectRepository(UserAchievement)
	private userAchievementsRepository: Repository<UserAchievement>,
  @InjectRepository(UserStats)
  private userStatsRepository: Repository<UserStats>,
  ) {}

  async findGameById(id: number): Promise<Game> {
    return this.gamesRepository.findOne({where: {id}, relations: ['player1', 'player2']})
  }

  async findGamesByUserId(userId: number, page: number, limit: number): Promise<Game[]> {
    return this.gamesRepository.find({where: [{player_1_user_id: userId}, {player_2_user_id: userId}], relations: ['player1', 'player2'], skip: (page - 1) * limit, take: limit});
  }

  async getLeaderBoard(page: number, limit: number): Promise<UserStats[]> {
    return this.userStatsRepository.find({relations: ['user'], order: {rank: 'ASC'}, skip: (page - 1) * limit, take: limit});
  }

  async findGameStatsById(id: number): Promise<GameStats> {
	return this.gameStatsRepository.findOne({where: {id}});
  }

  async findUserAchievementsForGame(userId: number, gameId: number): Promise<UserAchievement[]> {
	return this.userAchievementsRepository.find({where: {user_id: userId, game_id: gameId}});
  }
}
