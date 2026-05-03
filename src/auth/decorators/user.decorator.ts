import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthUser } from '../strategies/driver-jwt.strategy';

export const GetUserId = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    return (request.user as AuthUser)?.userId;
  },
);
