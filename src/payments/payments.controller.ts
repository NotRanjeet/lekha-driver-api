import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOkResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Request } from 'express';
import { DriverJwtAuthGuard } from '../auth/guards/driver-jwt-auth.guard';
import {
  DriverPortalGuard,
  getDriverFromReq,
} from '../guards/driver-portal.guard';
import { PaymentsService } from './payments.service';
import { PaymentDto, PaymentsSummaryDto } from './dto/payment.dto';

@ApiTags('Payments')
@ApiBearerAuth()
@UseGuards(DriverJwtAuthGuard, DriverPortalGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly service: PaymentsService) {}

  // ── GET /api/payments/summary ─────────────────────────────────────────────

  @Get('summary')
  @ApiOkResponse({ type: PaymentsSummaryDto })
  @ApiUnauthorizedResponse({ description: 'JWT invalid or driver not linked' })
  getSummary(@Req() req: Request): Promise<PaymentsSummaryDto> {
    const driver = getDriverFromReq(req as any);
    return this.service.getSummary(driver.id);
  }

  // ── GET /api/payments ─────────────────────────────────────────────────────

  @Get()
  @ApiOkResponse({ type: [PaymentDto] })
  @ApiUnauthorizedResponse({ description: 'JWT invalid or driver not linked' })
  getPayments(@Req() req: Request): Promise<PaymentDto[]> {
    const driver = getDriverFromReq(req as any);
    return this.service.getPayments(driver.id);
  }
}
