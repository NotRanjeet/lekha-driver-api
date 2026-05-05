import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { DriverPortalGuard } from '../guards/driver-portal.guard';

@Module({
  imports: [AuthModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, DriverPortalGuard],
})
export class PaymentsModule {}
