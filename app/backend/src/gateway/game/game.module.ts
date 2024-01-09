import { Module, forwardRef } from '@nestjs/common';
import { GameService } from './game.service';
import { GameGateway } from './game.gateway';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Game } from './models/game.entity';
import { UserStats } from 'src/api/users/entities/userstats.entity';
import { UserAchievement } from 'src/api/users/entities/userachievement.entity';
import { GameStats } from './models/gamestats.entity';
import { GamesController } from 'src/api/games/games.controller';
import { GamesApiService } from 'src/api/games/games.service';
import { PresenceModule } from '../common/presence.module';
import { UsersModule } from 'src/api/users/users.module';

@Module({
	imports: [
		TypeOrmModule.forFeature([Game, GameStats, UserStats, UserAchievement]),
		PresenceModule,
		forwardRef(() => UsersModule),
	],
	controllers: [GamesController],
	exports: [GameService],
	providers: [GameGateway, GameService, GamesApiService]
})
export class GameModule {}
