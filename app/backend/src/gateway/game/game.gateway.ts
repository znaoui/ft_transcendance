import { WebSocketGateway, OnGatewayConnection, OnGatewayDisconnect, WebSocketServer, SubscribeMessage } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { GameService } from './game.service';
import { MatchmakingResponse } from './models/game.responses';
import { InvitationResponsePayload } from './models/game.invitation';
import { GameType } from './models/game.payloads';
import { ChatAuthGuard } from '../chat/chat.auth.guard';
import { UseGuards } from '@nestjs/common';

@UseGuards(ChatAuthGuard)
@WebSocketGateway({
	namespace: 'game'
})
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  private server: Socket;

  constructor(private readonly gameService: GameService) {}

  handleConnection(socket: Socket): void {
    this.gameService.handleConnection(socket);
  }

  handleDisconnect(socket: Socket): void {
	  this.gameService.handleDisconnect(socket);
  }

  @SubscribeMessage("invitation_response")
  async invitationResponse(socket: Socket, payload: InvitationResponsePayload): Promise<MatchmakingResponse> {
    return await this.gameService.invitationResponse(socket, payload);
  }

  @SubscribeMessage("join_matchmaking")
  async joinMatchmaking(socket: Socket, type: GameType): Promise<MatchmakingResponse> {
	  return await this.gameService.joinMatchmaking(socket, type === GameType.POWERUPS);
  }

  @SubscribeMessage("leave_matchmaking")
  leaveMatchmaking(socket: Socket): void {
    this.gameService.leaveMatchmaking(socket);
  }

  @SubscribeMessage("join_game")
  async joinGame(socket: Socket, gameId: number): Promise<MatchmakingResponse> {
    return await this.gameService.joinGame(socket, gameId);
  }

  @SubscribeMessage("move_up")
  playerMoveUp(socket: Socket): void {
	  this.gameService.playerMoved(socket, true);
  }

  @SubscribeMessage("move_down")
  playerMoveDown(socket: Socket): void {
    this.gameService.playerMoved(socket, false);
  }
}
