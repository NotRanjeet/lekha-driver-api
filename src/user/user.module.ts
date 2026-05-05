import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { DriverPortalGuard } from '../guards/driver-portal.guard';

@Module({
  imports: [AuthModule],
  controllers: [UserController],
  providers: [UserService, DriverPortalGuard],
})
export class UserModule {}
