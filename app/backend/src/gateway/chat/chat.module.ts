import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { FriendshipModule } from 'src/api/friendship/friendship.module';
import { PrivateMessage } from './models/message.entity';
import { ChannelModule } from '../../api/channels/channel.module';
import { ChannelMessage } from './models/chatmessage.entity';
import { PresenceModule } from '../common/presence.module';

@Module({
	imports: [
		TypeOrmModule.forFeature([PrivateMessage, ChannelMessage]),
		forwardRef(() => FriendshipModule),
		forwardRef(() => ChannelModule),
		PresenceModule,
	],
	exports: [ChatService],
	providers: [ChatGateway, ChatService]
})
export class ChatModule {}
