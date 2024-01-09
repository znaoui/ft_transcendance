import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import * as session from 'express-session';
import * as passport from 'passport';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { SessionAdapter } from './gateway/session.adapter';
import * as PGSession from 'connect-pg-simple';

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  const PgSession = PGSession(session);
  const sessionMiddleware = session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 1000 * 60 * 60 * 24 * 7, httpOnly: true },
    store: new PgSession({
      conObject: {
        host: process.env.POSTGRES_HOST,
        port: 5432,
        user: process.env.POSTGRES_USER,
        password: process.env.POSTGRES_PASSWORD,
        database: process.env.POSTGRES_DB,
      },
      tableName: 'session',
    }),
   });
  app.useWebSocketAdapter(new SessionAdapter(sessionMiddleware, app));
  app.use(sessionMiddleware);
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(cookieParser());
  app.enableCors();
  app.setGlobalPrefix('/api')
  app.useGlobalPipes(new ValidationPipe({
    enableDebugMessages: process.env.NODE_ENV === 'development',
    stopAtFirstError: true,
    exceptionFactory: (errors) => {
      return new BadRequestException(errors[0].constraints[Object.keys(errors[0].constraints)[0]]);
    },
  }));

  const config = new DocumentBuilder()
    .setTitle('Transcendence API')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(3001);
}
bootstrap();
