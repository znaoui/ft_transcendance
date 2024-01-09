import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '../users/users.module';
import { FriendshipController } from './friendship.controller';
import { FriendshipService } from './friendship.service';
import { Friendship } from './friendship.entity';
import { ChatModule } from 'src/gateway/chat/chat.module';
import { PrivateMessage } from 'src/gateway/chat/models/message.entity';
import { PresenceModule } from 'src/gateway/common/presence.module';

@Module({
	imports: [
		TypeOrmModule.forFeature([Friendship, PrivateMessage]),
		forwardRef(() => UsersModule),
		forwardRef(() => ChatModule),
		PresenceModule,
	],
	providers: [FriendshipService],
	exports: [FriendshipService],
	controllers: [FriendshipController]
})
export class FriendshipModule {}
