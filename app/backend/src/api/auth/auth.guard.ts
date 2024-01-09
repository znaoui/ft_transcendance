import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {
	constructor() {
		super();
	}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const result = (await super.canActivate(context)) as boolean;
		const request = context.switchToHttp().getRequest<Request>();
		await super.logIn(request);
		return result;
	}
}

@Injectable()
export class AuthenticatedGuard implements CanActivate {
	canActivate(context: ExecutionContext): boolean {
		const request = context.switchToHttp().getRequest();
		const auth = request.isAuthenticated();
		if (auth) {
			return !request.session.passport.user.requires_totp;
		}
		return auth;
	}
}

@Injectable()
export class TwoFactorGuard implements CanActivate {
	canActivate(context: ExecutionContext): boolean {
		const request = context.switchToHttp().getRequest();
		return request.isAuthenticated() && !!request.session.passport.user.requires_totp;
	}
}

@Injectable()
export class OAuth42Guard extends AuthGuard('42-oauth') {
	constructor() {
		super();
	}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const result = (await super.canActivate(context)) as boolean;
		const request = context.switchToHttp().getRequest<Request>();
		await super.logIn(request);
		return result;
	}
}
