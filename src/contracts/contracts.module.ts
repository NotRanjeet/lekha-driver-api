import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ContractsController } from './contracts.controller';
import { ContractsService } from './contracts.service';
import { DriverPortalGuard } from '../guards/driver-portal.guard';

@Module({
  imports: [AuthModule],
  controllers: [ContractsController],
  providers: [ContractsService, DriverPortalGuard],
})
export class ContractsModule {}
