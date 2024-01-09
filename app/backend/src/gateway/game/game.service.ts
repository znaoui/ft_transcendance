import { Injectable, Logger } from '@nestjs/common';
import { GameStatus, Player, PlayerStatus, PongGame } from './models/game.class';
import { User } from './models/user.entity';
import * as Lock from 'async-lock';
import { MatchmakingResponse } from './models/game.responses';
import { Game } from './models/game.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Socket } from 'socket.io';
import { UserStats } from 'src/api/users/entities/userstats.entity';
import { GameAchievement, GameAchievements } from './models/game.achievements';
import { UserAchievement } from 'src/api/users/entities/userachievement.entity';
import { GameStats } from './models/gamestats.entity';
import { PresenceService } from '../common/presence.service';
import { PresenceStatus } from '../common/models/presence.status';
import { GameInvitation, GameInviteSent, GameInviter, InvitationResponsePayload } from './models/game.invitation';
import * as crypto from 'crypto';
import { GameType } from './models/game.payloads';

@Injectable()
export class GameService {
  private readonly logger = new Logger("GameService");
  private readonly _games: Map<number, PongGame> = new Map<number, PongGame>();
  private readonly _users: Map<string, User> = new Map<string, User>();
  private readonly _players: Map<string, Player> = new Map<string, Player>();
  private readonly _invitations: Map<string, GameInvitation> = new Map<string, GameInvitation>();
  private readonly _queuedUsersNormal: User[] = [];
  private readonly _queuedUsersLimited: User[] = [];
  private readonly _matchmakingLock: Lock = new Lock();

  constructor(
    @InjectRepository(Game)
    private readonly gamesRepository: Repository<Game>,
    @InjectRepository(GameStats)
    private readonly gamesStatsRepository: Repository<GameStats>,
    @InjectRepository(UserStats)
    private readonly usersStatsRepository: Repository<UserStats>,
    @InjectRepository(UserAchievement)
    private readonly usersAchievementsRepository: Repository<UserAchievement>,
    private readonly presenceService: PresenceService,
  ) { }

  handleConnection(socket: any): void {
	  this.logger.debug(`New connection: ${socket.id}`);
    if (!socket.request.user) {
      socket.disconnect();
      return;
    }
	  this.logger.log(`Client connected: ${socket.id}`);
    const user: User = {
      socket: socket,
      user_id: socket.request.user.id,
      username: socket.request.user.username,
      avatar: socket.request.user.avatar,
    };
    this._users.set(socket.id, user);
    const game = this.getUserGame(user);
    if (game && game.status !== GameStatus.Finished && game.status !== GameStatus.Aborted) {
      const player = game.getPlayer(user);
      if (player && player.status === PlayerStatus.NotReady) {
        player.user = user;
        const opponent = player == game.player1 ? game.player2 : game.player1;
        socket.emit("unfinished_game", {
          game_id: game.id,
          timeout: game.startTime,
          opponent: {
            id: opponent.user.user_id,
            username: opponent.user.username,
            avatar: opponent.user.avatar,
          },
        });
      }
    } else {
      const invitation = this.getInvitationForUser(user);
      if (invitation && invitation.invitee_id === user.user_id) {
        socket.emit("game_invitation", {
          id: invitation.id,
          inviter: {
            id: invitation.inviter.id,
            username: invitation.inviter.username,
            avatar: invitation.inviter.avatar,
          },
          expiresAt: invitation.expiration.getTime(),
          mode: invitation.mode,
        });
      }
    }
  }

  handleDisconnect(socket: any): void {
    this.logger.log(`Client disconnected: ${socket.id}`);
    this.leaveMatchmaking(socket);
    this._players.delete(socket.id);
    const user = this._users.get(socket.id);
    if (!user) {
      return;
    }
    this.presenceService.setPresenceFromGameService(user.user_id, PresenceStatus.OFFLINE);
    const game = this.getUserGame(user);
    if (game) {
      const player = game.getPlayer(user);
      if (player.user.socket.id === socket.id && player.status === PlayerStatus.Ready) {
        game.onPlayerDisconnect(user);
      }
    }
    this._users.delete(socket.id);
  }

  updateUserInfo(id: number, username: string, avatar: string) {
    const client = this.getUser(id);
    if (client) {
      client.username = username;
      client.avatar = avatar;
    }
  }

  async invitePlayer(inviter: GameInviter, inviteeUserId: number, mode: GameType): Promise<GameInviteSent> {
	if (inviter.id === inviteeUserId) {
		return { success: false, error: "You cannot invite yourself."}
	  }
    const user = this.getUser(inviter.id);
    if (user && this.getUserGame(user) !== null) {
      return { success: false, error: "You are already in a game."}
    }
    const invitee = this.getUser(inviteeUserId);
    if (invitee && this.getUserGame(invitee) !== null) {
      return { success: false, error: "Player is already in a game."}
    }
    const invitation = this.getInvitation(inviter.id, inviteeUserId);
    if (invitation) {
      if (invitation.expiration.getTime() - Date.now() > 0) {
        return { success: false, error: "An invitation is already pending with this player."}
      } else {
        this._invitations.delete(invitation.id);
      }
    }
    const id = crypto.randomUUID();
    const expiration = new Date(Date.now() + 1000 * 60 * 2); // 2 minutes
    this._invitations.set(id, {
      id,
      inviter: inviter,
      invitee_id: inviteeUserId,
      expiration,
      mode,
    });
    const sockets = this.getUserSockets(inviteeUserId);
    sockets.forEach((s) => {
      s.emit("game_invitation", {
        id: id,
        inviter: {
          id: inviter.id,
          username: inviter.username,
          avatar: inviter.avatar,
        },
        expiresAt: expiration.getTime(),
        mode,
      });
    });
    const that = this;
    setTimeout(function() {
      that._invitations.delete(id);
    }, expiration.getTime() - Date.now());
    return { success: true, expiration: expiration.getTime() };
  }

  async invitationResponse(socket: any, payload: InvitationResponsePayload): Promise<MatchmakingResponse> {
    const invitation = this._invitations.get(payload.invitation_id);
    if (!invitation) {
      return { success: false, error: "Invitation expired."}
    }
    const invitee = this._users.get(socket.id);
    if (!invitee || invitee.user_id !== invitation.invitee_id) {
      return { success: false, error: "You are not the invitee."}
    }
    if (!payload.accepted) {
      this._invitations.delete(invitation.id);
      return { success: true };
    }
    const inviter = this.getUser(invitation.inviter.id);
    if (!inviter) {
      this._invitations.delete(invitation.id);
      return { success: false, error: "Inviter is offline."}
    }
    this._invitations.delete(invitation.id);
    await this._matchmakingLock.acquire("matchmaking", async () => {
      if (this.isUserInGame(inviter)) {
        return { success: false, error: "Inviter is already in a game."}
      }
      const index = this._queuedUsersNormal.findIndex((u) => u.user_id === inviter.user_id);
      if (index !== -1) {
        this._queuedUsersNormal.splice(index, 1);
      }
      const index2 = this._queuedUsersLimited.findIndex((u) => u.user_id === inviter.user_id);
      if (index2 !== -1) {
        this._queuedUsersLimited.splice(index2, 1);
      }
      const game = await this.createNewGame(inviter, invitee, invitation.mode === GameType.POWERUPS);
      if (game) {
        inviter.socket.emit("match_found", {
          game_id: game.id,
          timeout: game.startTime,
          opponent: {
            id: invitee.user_id,
            username: invitee.username,
            avatar: invitee.avatar,
          },
        });
        invitee.socket.emit("match_found", {
          game_id: game.id,
          timeout: game.startTime,
          opponent: {
            id: inviter.user_id,
            username: inviter.username,
            avatar: inviter.avatar,
          },
        });
      }
    });
    return { success: true };
  }

  async joinMatchmaking(socket: any, enablePowerups: boolean): Promise<MatchmakingResponse> {
    this.logger.log(`Client ${socket.id} joined matchmaking.`);
    const user = this._users.get(socket.id);
    if (!user) {
      return { success: false, error: "You are not connected to the server."}
    }
    return await this._matchmakingLock.acquire("matchmaking", async () => {
      if (this.isUserInMatchmaking(user)) {
        return { success: false, error: "You are already in matchmaking"}
      } else if (this.isUserInGame(user)) {
        return { success: false, error: "You are already in a game"}
      }
      const queue = enablePowerups ? this._queuedUsersNormal : this._queuedUsersLimited;
      if (queue.length === 0) {
        queue.push(user);
      } else {
        const popedUser: User = queue.pop();
		if (!popedUser || popedUser.user_id === user.user_id) {
			return { success: false, error: "Something went wrong."}
		}
        this.logger.log(`Match found: ${user.username} vs ${popedUser.username}`);
        const game = await this.createNewGame(user, popedUser, enablePowerups);
        if (game) {
          user.socket.emit("match_found", {
            game_id: game.id,
            timeout: game.startTime,
            opponent: {
              id: popedUser.user_id,
              username: popedUser.username,
              avatar: popedUser.avatar,
            },
          });
          popedUser.socket.emit("match_found", {
            game_id: game.id,
            timeout: game.startTime,
            opponent: {
              id: user.user_id,
              username: user.username,
              avatar: user.avatar,
            },
          });
        }
      }
      return { success: true };
    });
  }

  async leaveMatchmaking(socket: any): Promise<void> {
    const user = this._users.get(socket.id);
    if (!user) {
      return;
    }
    await this._matchmakingLock.acquire("matchmaking", async () => {
      const index = this._queuedUsersNormal.findIndex((u) => u.user_id === user.user_id);
      if (index !== -1) {
        this._queuedUsersNormal.splice(index, 1);
      }
      const index2 = this._queuedUsersLimited.findIndex((u) => u.user_id === user.user_id);
      if (index2 !== -1) {
        this._queuedUsersLimited.splice(index2, 1);
      }
    });
  }

  async joinGame(socket: Socket, gameId: number): Promise<MatchmakingResponse> {
    const user = this._users.get(socket.id);
    if (!user) {
      return { success: false, error: "You are not connected to the server."}
    }
    const game = this._games.get(gameId);
    if (!game) {
      return { success: false, error: "Game not found." }
    }
    const player = game.getPlayer(user);
    if (!player) {
      return { success: false, error: "Game not found."};
    }
    if (player.status !== PlayerStatus.NotReady) {
      return { success: false, error: "Game does not accept new players."}
    }
    this.logger.log(`Client ${socket.id} joined game ${gameId}.`);
    player.status = PlayerStatus.Ready;
    this._players.set(socket.id, player);
    await this._matchmakingLock.acquire(`game_${game.id}`, async () => {
      if (game.player1.status === PlayerStatus.Ready && game.player2.status === PlayerStatus.Ready) {
        if (game.status === GameStatus.Paused) {
          game.resumeGame()
        } else {
          game.startGame();
        }
        this.presenceService.setPresenceFromGameService(game.player1.user.user_id, PresenceStatus.IN_GAME);
        this.presenceService.setPresenceFromGameService(game.player2.user.user_id, PresenceStatus.IN_GAME);
      }
    });
    return { success: true};
  }

  playerMoved(socket: any, up: boolean): void {
    const player = this._players.get(socket.id);
    if (player && player.status === PlayerStatus.Ready) {
      if (up) {
        player.paddle.moveUp();
      } else {
        player.paddle.moveDown();
      }
    }
  }

  private async onGameFinished(game: PongGame, winner: Player | null): Promise<void> {
    this.logger.log(`Game ${game.id} finished.`);
    this._players.delete(game.player1.user.socket.id);
    this._players.delete(game.player2.user.socket.id);
    this._games.delete(game.id);
    await this.gamesRepository.update(game.id, {
      winner_id: winner?.user.user_id,
      player_1_score: game.player1.score,
      player_2_score: game.player2.score,
      status: game.status,
      ended_at: new Date(),
    });
    if (game.status === GameStatus.Finished) {
      await Promise.all([
        this.saveGameStats(game),
        this.usersStatsRepository.update(game.player1.user.user_id, {
          games_played: game.player1.stats.gamesPlayed,
          games_won: game.player1.stats.gamesWon,
          games_lost: game.player1.stats.gamesLost,
          win_streak: game.player1.stats.gameWinsStreak,
          total_paddle_hits: game.player1.stats.totalPaddleHits,
          total_points_scored: game.player1.stats.totalPointsScored,
          total_play_time_seconds: game.player1.stats.totalPlayTimeSeconds,
        }),
        this.usersStatsRepository.update(game.player2.user.user_id, {
          games_played: game.player2.stats.gamesPlayed,
          games_won: game.player2.stats.gamesWon,
          games_lost: game.player2.stats.gamesLost,
          win_streak: game.player2.stats.gameWinsStreak,
          total_paddle_hits: game.player2.stats.totalPaddleHits,
          total_points_scored: game.player2.stats.totalPointsScored,
          total_play_time_seconds: game.player2.stats.totalPlayTimeSeconds,
        }),
        this.checkAchievements(game.id, game.player1, game.player2),
        this.checkAchievements(game.id, game.player2, game.player1),
      ]);
      await this.recalculateRankings();
    }
  }

  private async checkAchievements(game_id: number, player: Player, opponent: Player): Promise<void> {
    const addAchievement = async (achievement: GameAchievement) => {
      const userAchievement = await this.usersAchievementsRepository.findOne({
        where: {
          user_id: player.user.user_id,
          achievement_id: achievement.id,
        }
      });
      if (!userAchievement) {
        const a = new UserAchievement({
          user_id: player.user.user_id,
          game_id: game_id,
          achievement_id: achievement.id,
          name: achievement.name,
          description: achievement.description,
          icon: achievement.icon,
          created_at: new Date(),
        })
        await this.usersAchievementsRepository.save(a);
      }
    };
    const promises = [];
    for (const achievement in GameAchievements) {
      if (GameAchievements[achievement].conditionMet(player, opponent)) {
        promises.push(addAchievement(GameAchievements[achievement]));
      }
    }
    await Promise.all(promises);
  }

  private async recalculateRankings(): Promise<void> {
    this.logger.debug(`Recalculating rankings...`);
    const query = `
      WITH RankedPlayers AS (
        SELECT
          id,
          RANK() OVER (ORDER BY games_won DESC, total_points_scored DESC, id) AS new_rank
        FROM user_stats
      )
      UPDATE user_stats
      SET rank = RankedPlayers.new_rank
      FROM RankedPlayers
      WHERE user_stats.id = RankedPlayers.id
    `;
    await this.usersStatsRepository.query(query);
    this.logger.debug(`Rankings recalculated.`);
  }

  private async saveGameStats(game: PongGame): Promise<void> {
    const stats = new GameStats({
      id: game.id,
      player_1_user_id: game.player1.user.user_id,
      player_2_user_id: game.player2.user.user_id,
      player_1_score: game.player1.score,
      player_2_score: game.player2.score,
      player_1_paddle_hits: game.player1.stats.paddleHits,
      player_2_paddle_hits: game.player2.stats.paddleHits,
      player_1_wall_hits: game.player1.stats.wallBounces,
      player_2_wall_hits: game.player2.stats.wallBounces,
      player_1_top_paddle_hits: game.player1.stats.topPaddleHits,
      player_2_top_paddle_hits: game.player2.stats.topPaddleHits,
      player_1_bottom_paddle_hits: game.player1.stats.bottomPaddleHits,
      player_2_bottom_paddle_hits: game.player2.stats.bottomPaddleHits,
      player_1_largest_score_streak: game.player1.stats.largestScoreStreak,
      player_2_largest_score_streak: game.player2.stats.largestScoreStreak,
      total_play_time_seconds: game.player1.stats.totalPlayTimeSeconds + game.player2.stats.totalPlayTimeSeconds,
    });
    await this.gamesStatsRepository.save(stats);
  }

  private async createNewGame(player1: User, player2: User, enablePowerups: boolean): Promise<PongGame> {
    this.logger.log(`Creating new game: ${player1.username} vs ${player2.username}`);
    try {
      const game = new PongGame(enablePowerups);
      game.onGameFinished = this.onGameFinished.bind(this);
      const p1 = Math.random() < 0.5 ? player1 : player2;
      const p2 = p1 === player1 ? player2 : player1;
      const p1_stats = await this.usersStatsRepository.findOne({where: {user_id: p1.user_id}});
      const p2_stats = await this.usersStatsRepository.findOne({where: {user_id: p2.user_id}});
      game.player1 = new Player(p1, p1_stats, true);
      game.player2 = new Player(p2, p2_stats, false);
      const dbGame = await this.gamesRepository.save(new Game({
        player_1_user_id: game.player1.user.user_id,
        player_2_user_id: game.player2.user.user_id,
        player_1_score: 0,
        player_2_score: 0,
        status: GameStatus.Waiting,
      }));
      game.id = dbGame.id;
      this._games.set(game.id, game);
      return game;
    } catch (e) {
      this.logger.error(e);
      return null;
    }
  }

  private getInvitation(inviter: number, invitee: number): GameInvitation | null {
    for (const invitation of this._invitations.values()) {
      if (invitation.inviter.id === inviter && invitation.invitee_id === invitee
         || invitation.inviter.id === invitee && invitation.invitee_id === inviter) {
        return invitation;
      }
    }
    return null;
  }

  private getInvitationForUser(user: User): GameInvitation | null {
    for (const invitation of this._invitations.values()) {
      if (invitation.invitee_id === user.user_id) {
        return invitation;
      }
    }
    return null;
  }

  private getUserSockets(user_id: number): Socket[] {
    const sockets: Socket[] = [];
    for (const [socketId, u] of this._users.entries()) {
      if (u.user_id === user_id) {
        sockets.push(u.socket);
      }
    }
    return sockets;
  }

  private getUser(user_id: number) : User | null {
    for (const [socketId, u] of this._users.entries()) {
      if (u.user_id === user_id) {
        return u;
      }
    }
    return null;
  }

  private isUserInMatchmaking(user: User): boolean {
    for (const queuedUser of this._queuedUsersNormal.concat(this._queuedUsersLimited)) {
      if (queuedUser.user_id === user.user_id) {
        return true;
      }
    }
    return false;
  }

  private isUserInGame(user: User): boolean {
    return this.getUserGame(user) !== null;
  }

  private getUserGame(user: User): PongGame | null {
    if(this._games.size === 0) return null;
    for (const game of this._games.values()) {
      if ((game.player1.user.user_id === user.user_id || game.player2.user.user_id === user.user_id) &&
        game.status !== GameStatus.Finished && game.status !== GameStatus.Aborted) {
        return game;
      }
    }
    return null;
  }
}
