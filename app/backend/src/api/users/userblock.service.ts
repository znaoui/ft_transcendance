import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, UpdateResult } from 'typeorm';
import { UserBlock } from './entities/userblock.entity';

@Injectable()
export class UserBlockService {
  constructor(
    @InjectRepository(UserBlock)
    private blocksRepository: Repository<UserBlock>,
  ) {}

  async getAllForUser(userId: number): Promise<UserBlock[]> {
    return await this.blocksRepository.find({
      where: [{ blocker_user_id: userId }],
    });
  }

  async hasUserBlockedUser(blockerId: number, blockedUserId: number): Promise<boolean> {
    const block = await this.findOneBy({
      blocker_user_id: blockerId,
      blocked_user_id: blockedUserId,
    });
    return !!block;
  }

  async blocksExistBetweenUsers(userId1: number, userId2: number): Promise<boolean> {
    const block = await this.blocksRepository.findOne({
      where: [
        { blocker_user_id: userId1, blocked_user_id: userId2 },
        { blocker_user_id: userId2, blocked_user_id: userId1 },
      ],
    });
    return !!block;
  }

  async create(block: UserBlock): Promise<UserBlock> {
    return this.blocksRepository.save(block);
  }

  async findOneBy(params: any): Promise<UserBlock> {
    return this.blocksRepository.findOne({where: params});
  }

  async delete(id: number): Promise<void> {
    await this.blocksRepository.delete(id);
  }
}
