import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ContractsController } from './contracts.controller';
import { ContractsService } from './contracts.service';
import { DriverPortalGuard } from '../guards/driver-portal.guard';
import { StorageService } from '../common/services/storage.service';

@Module({
  imports: [AuthModule],
  controllers: [ContractsController],
  providers: [ContractsService, DriverPortalGuard, StorageService],
})
export class ContractsModule {}