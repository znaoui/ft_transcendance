import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { UsersModule } from '../users/users.module';
import { AuthService } from './auth.service';
import { PassportModule } from '@nestjs/passport';
import { LocalStrategy } from './local.strategy';
import { SessionSerializer } from './session.serializer';
import { OAuth42Strategy } from './42.strategy';

@Module({
	imports: [
		TypeOrmModule.forFeature([User]),
		UsersModule,
		PassportModule.register({ session: true })
	],
	controllers: [AuthController],
	providers: [AuthService, LocalStrategy, OAuth42Strategy,  SessionSerializer],
	exports: [AuthService]
})
export class AuthModule {}
