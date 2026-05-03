import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DriverPortalRequestsController } from './driver-portal-requests.controller';
import { DriverRequestsService } from './driver-requests.service';
import { DriverRequestsRepository } from './driver-requests.repository';
import { DriverPortalGuard } from '../guards/driver-portal.guard';

@Module({
  imports: [AuthModule],
  controllers: [DriverPortalRequestsController],
  providers: [
    DriverRequestsService,
    DriverRequestsRepository,
    DriverPortalGuard,
  ],
})
export class DriverRequestsModule {}
