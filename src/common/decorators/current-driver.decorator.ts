import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Driver } from '@prisma/client';

export const CurrentDriver = createParamDecorator(
  (data: keyof Driver | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const driver = request.user as Driver;
    return data ? driver?.[data] : driver;
  },
);
