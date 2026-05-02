import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayload } from './jwt.strategy';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_REFRESH_SECRET') ?? 'refresh-secret',
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: JwtPayload) {
    const authHeader = req.headers.authorization;
    const refreshToken = authHeader?.replace('Bearer ', '').trim();

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token missing');
    }

    const driver = await this.prisma.driver.findUnique({
      where: { id: payload.sub },
    });

    if (!driver || driver.refreshToken !== refreshToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    return { ...driver, refreshToken };
  }
}
