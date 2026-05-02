import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto, RegisterDto, ChangePasswordDto } from './dto/auth.dto';
import { AuthResponseDto, TokenPairDto } from './dto/auth-response.dto';
import { Driver } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  // ─── Register ─────────────────────────────────────────────────────────────

  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    const existing = await this.prisma.driver.findFirst({
      where: { OR: [{ email: dto.email }, { phone: dto.phone }] },
    });

    if (existing) {
      throw new ConflictException('Email or phone already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const driver = await this.prisma.driver.create({
      data: {
        email: dto.email,
        phone: dto.phone,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
      },
    });

    const tokens = await this.generateTokens(driver);
    await this.saveRefreshToken(driver.id, tokens.refreshToken);

    return {
      tokens,
      driver: {
        id: driver.id,
        email: driver.email,
        phone: driver.phone,
        firstName: driver.firstName,
        lastName: driver.lastName,
        status: driver.status,
      },
    };
  }

  // ─── Login ────────────────────────────────────────────────────────────────

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const driver = await this.prisma.driver.findUnique({
      where: { email: dto.email },
    });

    if (!driver) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatch = await bcrypt.compare(
      dto.password,
      driver.passwordHash,
    );
    if (!passwordMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.generateTokens(driver);
    await this.saveRefreshToken(driver.id, tokens.refreshToken);

    return {
      tokens,
      driver: {
        id: driver.id,
        email: driver.email,
        phone: driver.phone,
        firstName: driver.firstName,
        lastName: driver.lastName,
        status: driver.status,
      },
    };
  }

  // ─── Refresh Tokens ───────────────────────────────────────────────────────

  async refreshTokens(driver: Driver): Promise<TokenPairDto> {
    const tokens = await this.generateTokens(driver);
    await this.saveRefreshToken(driver.id, tokens.refreshToken);
    return tokens;
  }

  // ─── Logout ───────────────────────────────────────────────────────────────

  async logout(driverId: string): Promise<void> {
    await this.prisma.driver.update({
      where: { id: driverId },
      data: { refreshToken: null },
    });
  }

  // ─── Change Password ──────────────────────────────────────────────────────

  async changePassword(
    driverId: string,
    dto: ChangePasswordDto,
  ): Promise<void> {
    const driver = await this.prisma.driver.findUniqueOrThrow({
      where: { id: driverId },
    });

    const passwordMatch = await bcrypt.compare(
      dto.currentPassword,
      driver.passwordHash,
    );

    if (!passwordMatch) {
      throw new BadRequestException('Current password is incorrect');
    }

    const newHash = await bcrypt.hash(dto.newPassword, 12);
    await this.prisma.driver.update({
      where: { id: driverId },
      data: { passwordHash: newHash, refreshToken: null },
    });
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private async generateTokens(driver: Driver): Promise<TokenPairDto> {
    const payload = { sub: driver.id, email: driver.email };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(payload, {
        secret: this.config.get<string>('JWT_SECRET'),
        expiresIn: this.config.get<string>('JWT_EXPIRES_IN') ?? '15m',
      }),
      this.jwt.signAsync(payload, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.config.get<string>('JWT_REFRESH_EXPIRES_IN') ?? '7d',
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private async saveRefreshToken(
    driverId: string,
    refreshToken: string,
  ): Promise<void> {
    await this.prisma.driver.update({
      where: { id: driverId },
      data: { refreshToken },
    });
  }
}
