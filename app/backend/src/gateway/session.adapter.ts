import { INestApplicationContext } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { RequestHandler } from 'express';
import * as passport from 'passport';
import { ServerOptions } from 'socket.io';

export class SessionAdapter extends IoAdapter {
	private readonly sessionMiddleware: RequestHandler;

	constructor(sessionMiddleware: RequestHandler, app: INestApplicationContext) {
		super(app);
		this.sessionMiddleware = sessionMiddleware;
	}

	createIOServer(port: number, options?: ServerOptions): any {
		const server = super.createIOServer(port, {...options, cors: {
			origin: process.env.PUBLIC_URL,
			credentials: true,
		}});
		const wrap = (middleware) => (socket, next) => middleware(socket.request, {}, next);
		server.use(wrap(this.sessionMiddleware));
		server.use(wrap(passport.initialize()));
		server.use(wrap(passport.session()));
		return server;
	}

	create(port: number, options?: ServerOptions): any {
		const server = super.create(port, {...options, cors: {
			origin: process.env.PUBLIC_URL,
			credentials: true,
		}});
		const wrap = (middleware) => (socket, next) => middleware(socket.request, {}, next);
		server.use(wrap(this.sessionMiddleware));
		server.use(wrap(passport.initialize()));
		server.use(wrap(passport.session()));
		return server;
	}
}
