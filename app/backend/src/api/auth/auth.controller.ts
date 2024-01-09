import { Controller, Post, Request, Body, HttpException, HttpCode, Get, UseGuards, Response } from '@nestjs/common';
import { RegisterUserDto } from './dto/register.dto';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';
import { LoginDto, LoginResultDto } from './dto/login.dto';
import { LocalAuthGuard, AuthenticatedGuard, OAuth42Guard, TwoFactorGuard } from './auth.guard';
import * as speakeasy from 'speakeasy';
import { SetupTotpDto, TotpGenerateDto, VerifyTotpDto } from './dto/totp.dto';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { ErrorDTO } from '../common/dto/error.dto';
import { SuccessResponseDTO } from '../common/dto/success.dto';

@Controller('auth')
@ApiTags('auth')
export class AuthController {
	constructor(
		private readonly usersService: UsersService,
		) {}


	@Get('42')
	@UseGuards(OAuth42Guard)
	@ApiResponse({status: 302, description: 'Redirect to 42 OAuth page'})
	login42() {
	}

	@Get('callback')
	@UseGuards(OAuth42Guard)
	@ApiResponse({status: 302, description: 'Redirect to home page'})
	async callback(@Request() req: any, @Response() res) {
		let new_user = false;
		if (req.user) {
			let user = await this.usersService.findOneBy({user_id_42: req.user.id});
			if (!user) {
				 new_user = true;
				 const username = await this.usersService.createUniqueUsername(req.user.username);
				 user = await this.usersService.create(new User({
					username,
					avatar: req.user.avatar,
					user_id_42: req.user.id,
				}));
			} else {
				req.user.username = user.username;
				req.user.avatar = user.avatar;
				req.user.requires_totp = !!user.totp_secret;
			}
			req.user.id = user.id;
			if (req.user.requires_totp) {
				res.redirect(process.env.PUBLIC_URL + '/login/2fa');
			} else if (new_user) {
				res.redirect(process.env.PUBLIC_URL + '/setting');
			}
			else {
				res.redirect(process.env.PUBLIC_URL + '/');
			}
		} else {
			res.redirect(process.env.PUBLIC_URL + '/login?error=oauth_error')
		}
	}

	@UseGuards(LocalAuthGuard)
	@Post('login')
	@HttpCode(200)
	@ApiResponse({status: 200, description: 'User logged and may require 2FA', type: LoginResultDto})
	@ApiResponse({status: 400, description: 'Username or password validation failed', type: ErrorDTO})
	@ApiResponse({status: 401, description: 'Invalid credentials', type: ErrorDTO})
	async login(@Request() req: any, @Body() loginDto: LoginDto) {
		return new LoginResultDto(!!req.user.requires_totp);
	}

	@UseGuards(AuthenticatedGuard)
	@Post('logout')
	@HttpCode(200)
	@ApiResponse({status: 200, description: 'User logged out'})
	@ApiResponse({status: 401, description: 'Unauthorized', type: ErrorDTO})
	async logout(@Request() req: any) {
		req.session.destroy();
		req.logout((err) => {
			if (err) {
				throw new HttpException('Unauthorized', 401);
			}
		})
	}

	@Post('register')
	@HttpCode(201)
	@ApiResponse({ status: 201, description: 'User successfully registered', type: SuccessResponseDTO})
	@ApiResponse({ status: 403, description: 'Already registered', type: ErrorDTO})
	@ApiResponse({ status: 400, description: 'Username or password validation failed', type: ErrorDTO})
	async register(@Request() req: any, @Body() registerUserDto: RegisterUserDto) {
		if (req.user && req.user.id) {
			throw new HttpException('Already registered', 403);
		}
		if (registerUserDto.password !== registerUserDto.confirm_password) {
			throw new HttpException('Passwords do not match', 400);
		}
		const existing = await this.usersService.findOneByUsername(registerUserDto.username);
		if (existing) {
			throw new HttpException('Username already exists', 400);
		}
		const hash = await this.usersService.hashPassword(registerUserDto.password);
		const user = await this.usersService.create(new User({
			username: registerUserDto.username,
			password: hash,
		}));
		const loginPromise = new Promise<boolean>((resolve, reject) => {
			req.login(user, (err: any) => {
			if (err) {
				reject(false);
			} else {
				resolve(true);
			}
			});
		});
		const result = await loginPromise;
		return new SuccessResponseDTO(result);
	}

	@Post('/totp/generate')
	@HttpCode(200)
	@UseGuards(AuthenticatedGuard)
	@ApiResponse({status: 200, description: 'TOTP secret successfully generated', type: TotpGenerateDto})
	@ApiResponse({status: 400, description: '2FA already setup', type: ErrorDTO})
	@ApiResponse({status: 401, description: 'Unauthorized', type: ErrorDTO})
	async generateTotp(@Request() req: any) {
		const user = await this.usersService.findOneBy({id: req.user.id});
		if (user.totp_secret) {
			throw new HttpException('2FA already setup', 400);
		}
		const secret = speakeasy.generateSecret({
			name: '42-ft_transcendence',
			length: 20
		});
		return new TotpGenerateDto(secret.otpauth_url);
	}

	@Post('/totp/setup')
	@HttpCode(200)
	@UseGuards(AuthenticatedGuard)
	@ApiResponse({status: 200, description: 'TOTP successfully setup'})
	@ApiResponse({status: 400, description: '2FA already setup', type: ErrorDTO})
	@ApiResponse({status: 403, description: 'Invalid token', type: ErrorDTO})
	@ApiResponse({status: 401, description: 'Unauthorized', type: ErrorDTO})
	async setupTotp(@Request() req: any, @Body() body: SetupTotpDto) {
		const user = await this.usersService.findOneBy({id: req.user.id});
		if (user.totp_secret) {
			throw new HttpException('2FA already setup', 400);
		}
		const verified = speakeasy.totp.verify({
			secret: body.secret,
			encoding: 'base32',
			token: body.token,
			window: 1,
		});
		if (!verified) {
			throw new HttpException('Invalid token', 403);
		}
		await this.usersService.update(user.id, {totp_secret: body.secret});
	}

	@Post('/totp/verify')
	@HttpCode(200)
	@UseGuards(TwoFactorGuard)
	@ApiResponse({status: 200, description: 'TOTP successfully verified'})
	@ApiResponse({status: 400, description: '2FA not setup', type: ErrorDTO})
	@ApiResponse({status: 403, description: 'Invalid token', type: ErrorDTO})
	@ApiResponse({status: 401, description: 'Unauthorized - 2FA not required', type: ErrorDTO})
	async verifyTotp(@Request() req: any, @Body() body: VerifyTotpDto) {
		const user = await this.usersService.findOneBy({id: req.user.id});
		if (!user.totp_secret) {
			throw new HttpException('2FA not setup', 400);
		}
		const verified = speakeasy.totp.verify({
			secret: user.totp_secret,
			encoding: 'base32',
			token: body.token,
			window: 1,
		});
		if (!verified) {
			throw new HttpException('Invalid code', 403);
		}
		req.user.requires_totp = false;
	}

	@Post('/totp/disable')
	@HttpCode(200)
	@UseGuards(AuthenticatedGuard)
	@ApiResponse({status: 200, description: 'TOTP successfully disabled'})
	@ApiResponse({status: 400, description: '2FA not setup', type: ErrorDTO})
	async disableTotp(@Request() req: any) {
		const user = await this.usersService.findOneBy({id: req.user.id});
		if (!user.totp_secret) {
			throw new HttpException('2FA not setup', 400);
		}
		await this.usersService.update(user.id, {totp_secret: null});
	}
}
