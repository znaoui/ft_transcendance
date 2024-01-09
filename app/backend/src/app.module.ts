import { Module, NestModule } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './api/auth/auth.module';
import { UsersModule } from './api/users/users.module';
import { User } from './api/users/entities/user.entity';
import * as dotenv from 'dotenv';
import { Friendship } from './api/friendship/friendship.entity';
import { FriendshipModule } from './api/friendship/friendship.module';
import { UserBlock } from './api/users/entities/userblock.entity';
import { ChannelModule } from './api/channels/channel.module';
import { Channel } from './api/channels/entities/channel.entity';
import { ChannelUser } from './api/channels/entities/channel_user.entity';
import { ChannelInvitation } from './api/channels/entities/channel_invitation.entity';
import { ChannelMute } from './api/channels/entities/channel_mute.entity';
import { ChannelBan } from './api/channels/entities/channel_ban.entity';
import { ChatModule } from './gateway/chat/chat.module';
import { NoCacheMiddleware } from './api/cache.middleware';
import { PrivateMessage } from './gateway/chat/models/message.entity';
import { ChannelMessage } from './gateway/chat/models/chatmessage.entity';
import { GameModule } from './gateway/game/game.module';
import { Game } from './gateway/game/models/game.entity';
import { UserStats } from './api/users/entities/userstats.entity';
import { UserAchievement } from './api/users/entities/userachievement.entity';
import { GameStats } from './gateway/game/models/gamestats.entity';
import { PresenceModule } from './gateway/common/presence.module';

if (process.env.NODE_ENV !== 'production') {
  dotenv.config({path: __dirname + '/../../../.env'});
}

export const STATIC_PATH = process.env.NODE_ENV === 'production' ? join(__dirname, '..', 'public') : __dirname + '/../../../../data/web-public-dev';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: STATIC_PATH,
      exclude: ['/api*']
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.POSTGRES_HOST,
      port: 5432,
      username: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      database: process.env.POSTGRES_DB,
      entities: [
        User,
        Friendship,
        UserBlock,
        Channel,
        ChannelUser,
        ChannelInvitation,
        ChannelMute,
        ChannelBan,
        PrivateMessage,
        ChannelMessage,
        Game,
        GameStats,
        UserStats,
        UserAchievement,
      ],
      synchronize: process.env.NODE_ENV !== 'production',
    }),
    UsersModule,
    AuthModule,
    FriendshipModule,
    ChannelModule,
    ChatModule,
    GameModule,
    PresenceModule
  ],
  controllers: [],
  providers: [NoCacheMiddleware],
})
export class AppModule implements NestModule
{
  configure(consumer: import('@nestjs/common').MiddlewareConsumer): any {
    consumer
      .apply(NoCacheMiddleware)
      .forRoutes('*');
  }
}
