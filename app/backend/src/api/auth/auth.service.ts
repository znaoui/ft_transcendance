import { Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';
import fetch from 'node-fetch';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
  ) {}

  async validateUser(username: string, password: string): Promise<any> {
    const user = await this.usersService.findOneBy({username: username});
    if (user && await this.verifyPassword(user, password)) {
      return {id: user.id, username: user.username, avatar: user.avatar, requires_totp: !!user.totp_secret};
    }
    return null;
  }

  async get42Profile(accessToken: string): Promise<any> {
    const response = await fetch(process.env.OAUTH_USER_URI, {
			headers: {
				'Authorization': `Bearer ${accessToken}`,
			},
		});
		if (!response.ok) {
      return null;
		}
		return await response.json();
  }

  async verifyPassword(user: User, rawPassword: string): Promise<boolean> {
    return await argon2.verify(user.password, process.env.PASSWORD_SALT + rawPassword);
  }

  async hashPassword(password: string): Promise<string> {
    return await argon2.hash(process.env.PASSWORD_SALT + password);
  }
}
