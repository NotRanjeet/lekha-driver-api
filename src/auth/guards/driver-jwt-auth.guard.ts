import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class DriverJwtAuthGuard extends AuthGuard('driver-jwt') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }
}
