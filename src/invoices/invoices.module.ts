import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { InvoicesController } from './invoices.controller';
import { InvoicesService } from './invoices.service';
import { DriverPortalGuard } from '../guards/driver-portal.guard';

@Module({
  imports: [AuthModule],
  controllers: [InvoicesController],
  providers: [InvoicesService, DriverPortalGuard],
})
export class InvoicesModule {}
