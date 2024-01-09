import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, UpdateResult } from 'typeorm';
import { User } from './entities/user.entity';
import * as argon2 from 'argon2';
import { UserStats } from './entities/userstats.entity';
import { Game } from 'src/gateway/game/models/game.entity';
import { UserAchievement } from './entities/userachievement.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(UserStats)
    private usersStatsRepository: Repository<UserStats>,
    @InjectRepository(Game)
    private gamesRepository: Repository<Game>,
    @InjectRepository(UserAchievement)
    private achievementsRepository: Repository<UserAchievement>,
  ) {}

  async verifyPassword(user: User, rawPassword: string): Promise<boolean> {
    return await argon2.verify(user.password, process.env.PASSWORD_SALT + rawPassword);
  }

  async hashPassword(password: string): Promise<string> {
    return await argon2.hash(process.env.PASSWORD_SALT + password);
  }

  async createUniqueUsername(username: string): Promise<string> {
    let newUsername = username;
    let counter = 2;
    while (await this.findOneBy({username: newUsername}) !== null) {
      newUsername = `${username}${counter}`;
      counter++;
    }
    return newUsername;
  }

  async create(user: User): Promise<User> {
    const u = await this.usersRepository.save(user);
    this.usersStatsRepository.save(new UserStats({user_id: u.id, rank: u.id}));
    return u;
  }

  async findOneByUsername(username: string): Promise<User | null> {
    const user = await this.usersRepository
      .createQueryBuilder('user')
      .where('LOWER(user.username) = :username', { username: username.toLowerCase() })
      .getOne();
    return user;
  }

  async getUserGamesHistory(userId: number, page: number, limit: number): Promise<Game[]> {
    return this.gamesRepository.find({
      where: [{player_1_user_id: userId}, {player_2_user_id: userId}],
      relations: ['player1', 'player2'],
      order: {created_at: 'DESC'},
      take: limit,
      skip: (page - 1) * limit
    });
  }

  async getUserAchievements(userId: number): Promise<UserAchievement[]> {
    return this.achievementsRepository.find({where: {user_id: userId}});
  }

  async getUserStats(userId: number): Promise<UserStats> {
    return this.usersStatsRepository.findOne({where: {user_id: userId}});
  }

  async findOneBy(options: any): Promise<User | null> {
    return this.usersRepository.findOne({where: options});
  }

  async findManyBy(options: any, limit: number, page: number): Promise<User[]> {
    return this.usersRepository.find({where: options, take: limit, skip: (page - 1) * limit});
  }

  async update(id: number, data: any): Promise<UpdateResult> {
  return this.usersRepository.update(id, data);
  }

  async remove(id: number): Promise<void> {
    await this.usersStatsRepository.delete({user_id: id});
    await this.usersRepository.delete(id);
  }
}
