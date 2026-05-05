import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { RequestsController } from './requests.controller';
import { RequestsService } from './requests.service';
import { RequestsRepository } from './requests.repository';
import { DriverPortalGuard } from '../guards/driver-portal.guard';

@Module({
  imports: [AuthModule],
  controllers: [RequestsController],
  providers: [RequestsService, RequestsRepository, DriverPortalGuard],
})
export class RequestsModule {}
