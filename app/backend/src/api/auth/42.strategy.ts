import { HttpException, Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy } from "passport-oauth2"
import { AuthService } from "./auth.service";

@Injectable()
export class OAuth42Strategy extends PassportStrategy(Strategy, '42-oauth') {
	constructor(
		private readonly authService: AuthService) {
		super({
		  authorizationURL: process.env.OAUTH_AUTHORIZE_URI,
		  tokenURL: process.env.OAUTH_TOKEN_URI,
		  clientID: process.env.OAUTH_CLIENT_ID,
		  clientSecret: process.env.OAUTH_SECRET,
		  callbackURL: process.env.OAUTH_CALLBACK_URI,
		});
	}

	async validate(accessToken: string, refreshToken: string, profile: any, done: (err: Error, user: any) => void): Promise<any> {
		const p = await this.authService.get42Profile(accessToken);
		if (!p) {
			throw new HttpException('Unauthorized', 401);
		}
		const user = {id: p.id, username: p.login, avatar: p.image.link}
		done(null, user);
	}
}
