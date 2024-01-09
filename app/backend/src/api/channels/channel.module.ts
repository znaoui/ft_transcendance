import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '../users/users.module';
import { Channel } from './entities/channel.entity';
import { ChannelUser } from './entities/channel_user.entity';
import { ChannelService } from './channel.service';
import { ChannelController } from './channel.controller';
import { ChannelInvitation } from './entities/channel_invitation.entity';
import { ChannelMute } from './entities/channel_mute.entity';
import { ChannelBan } from './entities/channel_ban.entity';
import { ChannelMessage } from '../../gateway/chat/models/chatmessage.entity';
import { ChatModule } from '../../gateway/chat/chat.module';

@Module({
	imports: [
		TypeOrmModule.forFeature([Channel, ChannelUser, ChannelInvitation, ChannelMute, ChannelBan, ChannelMessage]),
		forwardRef(() => UsersModule),
		forwardRef(() => ChatModule),
	],
	providers: [ChannelService],
	exports: [ChannelService],
	controllers: [ChannelController]
})
export class ChannelModule {}
