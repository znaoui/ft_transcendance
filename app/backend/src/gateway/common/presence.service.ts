import { Injectable } from '@nestjs/common';
import * as Lock from 'async-lock';
import { PresenceStatus } from './models/presence.status';

@Injectable()
export class PresenceService {
  private readonly clients: Map<number, PresenceStatus> = new Map();
  private readonly lock: Lock = new Lock();

  public onPresenceChange: (userId: number, status: PresenceStatus, fromGameService: boolean) => void;

  constructor() {}

  public async setPresence(userId: number, status: PresenceStatus) {
	await this.lock.acquire(userId.toString(), async () => {
		if (status === PresenceStatus.OFFLINE) {
			this.clients.delete(userId);
		} else {
	  		this.clients.set(userId, status);
		}
		if (this.onPresenceChange) {
			this.onPresenceChange(userId, status, false);
		}
	});
  }

  public async setPresenceFromGameService(userId: number, status: PresenceStatus) {
	await this.lock.acquire(userId.toString(), async () => {
		this.clients.set(userId, status);
		if (this.onPresenceChange) {
			this.onPresenceChange(userId, status, true);
		}
	});
  }

  public async getPresence(userId: number): Promise<PresenceStatus> {
	return await this.lock.acquire(userId.toString(), async () => {
		return this.clients.get(userId) || PresenceStatus.OFFLINE;
	});
  }
}
