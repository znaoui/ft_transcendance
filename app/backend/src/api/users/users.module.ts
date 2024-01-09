import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { UserBlockService } from './userblock.service';
import { UserBlock } from './entities/userblock.entity';
import { FriendshipModule } from '../friendship/friendship.module';
import { ChatModule } from 'src/gateway/chat/chat.module';
import { UserStats } from './entities/userstats.entity';
import { UserAchievement } from './entities/userachievement.entity';
import { Game } from 'src/gateway/game/models/game.entity';
import { GameModule } from 'src/gateway/game/game.module';

@Module({
	imports: [
		TypeOrmModule.forFeature([User, UserBlock, UserStats, UserAchievement, Game]),
		forwardRef(() => FriendshipModule),
		ChatModule,
		forwardRef(() => GameModule),
	],
	providers: [UsersService, UserBlockService],
	exports: [UsersService, UserBlockService],
	controllers: [UsersController]
})
export class UsersModule {}
