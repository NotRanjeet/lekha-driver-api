import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../common/database/prisma.service';
import { AuthUser } from '../auth/strategies/driver-jwt.strategy';

export interface DriverPayload {
  id: string;
  owner_company_id: string;
}

export function getDriverFromReq(req: Record<string, any>): DriverPayload {
  return req.driver as DriverPayload;
}

@Injectable()
export class DriverPortalGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId: string | undefined = (request.user as AuthUser)?.userId;

    if (!userId) {
      throw new UnauthorizedException('Not authenticated');
    }

    const driver = await this.prisma.drivers.findFirst({
      where: { auth_user_id: userId },
      select: { id: true, owner_company_id: true },
    });

    if (!driver) {
      throw new UnauthorizedException(
        'No driver account is linked to this user. Please contact your fleet manager.',
      );
    }

    request.driver = driver;
    return true;
  }
}
