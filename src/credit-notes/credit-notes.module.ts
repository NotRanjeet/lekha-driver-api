import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CreditNotesController } from './credit-notes.controller';
import { CreditNotesService } from './credit-notes.service';
import { DriverPortalGuard } from '../guards/driver-portal.guard';

@Module({
  imports: [AuthModule],
  controllers: [CreditNotesController],
  providers: [CreditNotesService, DriverPortalGuard],
})
export class CreditNotesModule {}
