import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, UpdateResult } from 'typeorm';
import { Friendship, FriendshipStatus } from './friendship.entity';
import { PrivateMessage } from 'src/gateway/chat/models/message.entity';

@Injectable()
export class FriendshipService {
  constructor(
    @InjectRepository(Friendship)
    private friendshipsRepository: Repository<Friendship>,
    @InjectRepository(PrivateMessage)
    private messagesRepository: Repository<PrivateMessage>
  ) {}

  async getAllForUser(user_id: number): Promise<Friendship[]> {
    return await this.friendshipsRepository.find({
      where: [{ sender_id: user_id, status: FriendshipStatus.ACCEPTED }, { receiver_id: user_id, status: FriendshipStatus.ACCEPTED }],
    });
  }

  async getMessages(user_id1: number, user_id2: number, page: number, limit: number): Promise<PrivateMessage[]> {
    return await this.messagesRepository.find({
      where: [{ sender_id: user_id1, receiver_id: user_id2 }, { sender_id: user_id2, receiver_id: user_id1 }],
      order: { created_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  async getAllRequestsForUser(user_id: number): Promise<Friendship[]> {
    return await this.friendshipsRepository.find({
      where: [{ sender_id: user_id, status: FriendshipStatus.PENDING }, { receiver_id: user_id, status: FriendshipStatus.PENDING }],
    });
  }

  async findFriendshipBetween(user_id1: number, user_id2: number): Promise<Friendship | null> {
    return await this.friendshipsRepository.findOne({
      where: [{ sender_id: user_id1, receiver_id: user_id2 }, { sender_id: user_id2, receiver_id: user_id1 }],
    });
  }

  async deleteFriendshipBetween(user_id1: number, user_id2: number): Promise<void> {
    const friendship = await this.findFriendshipBetween(user_id1, user_id2);
    if (friendship) {
      await this.delete(friendship.id);
    }
  }

  async findOneBy(options: any): Promise<Friendship | null> {
    return this.friendshipsRepository.findOne({where: options});
  }

  async create(friendship: Friendship): Promise<Friendship> {
	return await this.friendshipsRepository.save(friendship);
  }

  async update(id: number, data: any): Promise<UpdateResult> {
	return await this.friendshipsRepository.update(id, data);
  }

  async delete(id: number): Promise<void> {
    await this.friendshipsRepository.delete(id);
  }

}
