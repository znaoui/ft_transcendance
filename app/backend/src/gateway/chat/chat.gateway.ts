import { WebSocketGateway, OnGatewayConnection, OnGatewayDisconnect, WebSocketServer, SubscribeMessage } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { UseGuards } from '@nestjs/common';
import { ChatAuthGuard } from './chat.auth.guard';
import { ChannelMessageData, PrivateMessageData } from './models/message.entity';

@UseGuards(ChatAuthGuard)
@WebSocketGateway({
  namespace: 'chat'
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  private server: Socket;

  constructor(private readonly chatService: ChatService) {}

  handleConnection(socket: Socket): void {
    this.chatService.handleConnection(socket);
  }

  handleDisconnect(socket: Socket): void {
	  this.chatService.handleDisconnect(socket);
  }

  @SubscribeMessage('private_message')
  async handlePrivateMessage(socket: Socket, data: PrivateMessageData): Promise<any> {
    return await this.chatService.handlePrivateMessage(socket, data);
  }

  @SubscribeMessage('channel_message')
  async handleChannelMessage(socket: Socket, data: ChannelMessageData): Promise<any> {
    return await this.chatService.handleChannelMessage(socket, data);
  }
}
