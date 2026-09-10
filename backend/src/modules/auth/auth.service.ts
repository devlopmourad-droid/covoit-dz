import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { User } from '../users/entities/user.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { BUSINESS_RULES } from '../../config/business-rules.config';

const BCRYPT_ROUNDS = 12;
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private usersRepo: Repository<User>,
    @InjectRepository(RefreshToken) private refreshRepo: Repository<RefreshToken>,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.usersRepo.findOne({ where: { email: dto.email.toLowerCase() } });
    if (existing) {
      throw new ConflictException('Un compte existe déjà avec cet email.');
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const user = this.usersRepo.create({
      email: dto.email.toLowerCase(),
      passwordHash,
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone,
      roles: dto.roles && dto.roles.length > 0 ? dto.roles : ['renter'],
    });
    const saved = await this.usersRepo.save(user);
    return this.issueTokens(saved);
  }

  async login(dto: LoginDto, meta: { ip?: string; userAgent?: string }) {
    const user = await this.usersRepo.findOne({ where: { email: dto.email.toLowerCase() } });
    if (!user) {
      throw new UnauthorizedException('Email ou mot de passe incorrect.');
    }

    if (user.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
      const minutesLeft = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
      throw new UnauthorizedException(
        `Compte temporairement verrouillé suite à plusieurs échecs de connexion. Réessayez dans ${minutesLeft} min.`,
      );
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      user.failedLoginAttempts += 1;
      if (user.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
        user.lockedUntil = new Date(Date.now() + LOCKOUT_MINUTES * 60000);
        user.failedLoginAttempts = 0;
      }
      await this.usersRepo.save(user);
      throw new UnauthorizedException('Email ou mot de passe incorrect.');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Ce compte a été désactivé.');
    }

    user.failedLoginAttempts = 0;
    user.lockedUntil = null;
    await this.usersRepo.save(user);

    return this.issueTokens(user, meta);
  }

  async refresh(rawToken: string) {
    const tokenHash = this.hashToken(rawToken);
    const stored = await this.refreshRepo.findOne({
      where: { tokenHash },
      relations: ['user'],
    });
    if (!stored || stored.revokedAt || stored.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException('Session expirée, merci de vous reconnecter.');
    }
    // rotation : on révoque l'ancien refresh token et on en émet un nouveau
    stored.revokedAt = new Date();
    await this.refreshRepo.save(stored);
    return this.issueTokens(stored.user);
  }

  async logout(rawToken: string) {
    const tokenHash = this.hashToken(rawToken);
    await this.refreshRepo.update({ tokenHash }, { revokedAt: new Date() });
    return { success: true };
  }

  private async issueTokens(user: User, meta?: { ip?: string; userAgent?: string }) {
    const payload = { sub: user.id, email: user.email, roles: user.roles };

    const accessToken = this.jwt.sign(payload, {
      secret: this.config.get<string>('JWT_ACCESS_SECRET'),
      expiresIn: this.config.get<string>('JWT_ACCESS_EXPIRES_IN') || '15m',
    });

    const rawRefreshToken = crypto.randomBytes(48).toString('hex');
    const refreshExpiresInDays = 30;
    const refreshEntity = this.refreshRepo.create({
      user,
      tokenHash: this.hashToken(rawRefreshToken),
      expiresAt: new Date(Date.now() + refreshExpiresInDays * 24 * 60 * 60 * 1000),
    });
    await this.refreshRepo.save(refreshEntity);

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roles: user.roles,
      },
      businessRules: {
        minDriverAge: BUSINESS_RULES.MIN_DRIVER_AGE,
      },
    };
  }

  private hashToken(raw: string) {
    return crypto.createHash('sha256').update(raw).digest('hex');
  }
}
