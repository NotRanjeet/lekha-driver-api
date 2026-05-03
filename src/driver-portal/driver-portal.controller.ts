import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiNotFoundResponse,
  ApiConflictResponse,
} from '@nestjs/swagger';
import { Request } from 'express';
import { DriverJwtAuthGuard } from '../auth/guards/driver-jwt-auth.guard';
import {
  DriverPortalGuard,
  getDriverFromReq,
} from '../guards/driver-portal.guard';
import { GetUserId } from '../auth/decorators/user.decorator';
import { DriverPortalService } from './driver-portal.service';
import {
  AcceptInviteDto,
  AcceptInviteResponseDto,
} from './dto/accept-invite.dto';
import {
  DriverProfileResponse,
  DriverContractSummary,
  DriverInvoiceSummary,
  DriverPaymentSummary,
  DriverBalanceSummary,
} from './dto/driver-portal-response.dto';

@ApiTags('Driver Portal')
@ApiBearerAuth()
@UseGuards(DriverJwtAuthGuard)
@Controller('driver-portal')
export class DriverPortalController {
  constructor(private readonly service: DriverPortalService) {}

  // ── POST /driver-portal/accept-invite ─────────────────────────────────────
  // No DriverPortalGuard — the driver is not yet linked when this is called

  @Post('accept-invite')
  @ApiCreatedResponse({ type: AcceptInviteResponseDto })
  @ApiBadRequestResponse({ description: 'Token has expired' })
  @ApiUnauthorizedResponse({ description: 'JWT missing or invalid' })
  @ApiNotFoundResponse({ description: 'Token not found / already used' })
  @ApiConflictResponse({
    description: 'Driver already linked, or caller already linked',
  })
  acceptInvite(
    @GetUserId() userId: string,
    @Body() dto: AcceptInviteDto,
  ): Promise<AcceptInviteResponseDto> {
    return this.service.acceptInvite(userId, dto.token);
  }

  // ── GET /driver-portal/me ─────────────────────────────────────────────────

  @Get('me')
  @UseGuards(DriverPortalGuard)
  @ApiOkResponse({ type: DriverProfileResponse })
  @ApiUnauthorizedResponse({ description: 'JWT invalid or driver not linked' })
  @ApiNotFoundResponse({ description: 'Driver record not found' })
  getProfile(@Req() req: Request): Promise<DriverProfileResponse> {
    const driver = getDriverFromReq(req as any);
    return this.service.getProfile(driver.id);
  }

  // ── GET /driver-portal/contracts ─────────────────────────────────────────

  @Get('contracts')
  @UseGuards(DriverPortalGuard)
  @ApiOkResponse({ type: [DriverContractSummary] })
  @ApiUnauthorizedResponse({ description: 'JWT invalid or driver not linked' })
  getContracts(@Req() req: Request): Promise<DriverContractSummary[]> {
    const driver = getDriverFromReq(req as any);
    return this.service.getContracts(driver.id);
  }

  // ── GET /driver-portal/contracts/:id ─────────────────────────────────────

  @Get('contracts/:id')
  @UseGuards(DriverPortalGuard)
  @ApiOkResponse({ type: DriverContractSummary })
  @ApiUnauthorizedResponse({ description: 'JWT invalid or driver not linked' })
  @ApiNotFoundResponse({ description: 'Contract not found' })
  getContract(
    @Req() req: Request,
    @Param('id') id: string,
  ): Promise<DriverContractSummary> {
    const driver = getDriverFromReq(req as any);
    return this.service.getContract(driver.id, id);
  }

  // ── GET /driver-portal/invoices ───────────────────────────────────────────

  @Get('invoices')
  @UseGuards(DriverPortalGuard)
  @ApiOkResponse({ type: [DriverInvoiceSummary] })
  @ApiUnauthorizedResponse({ description: 'JWT invalid or driver not linked' })
  getInvoices(@Req() req: Request): Promise<DriverInvoiceSummary[]> {
    const driver = getDriverFromReq(req as any);
    return this.service.getInvoices(driver.id);
  }

  // ── GET /driver-portal/payments ───────────────────────────────────────────

  @Get('payments')
  @UseGuards(DriverPortalGuard)
  @ApiOkResponse({ type: [DriverPaymentSummary] })
  @ApiUnauthorizedResponse({ description: 'JWT invalid or driver not linked' })
  getPayments(@Req() req: Request): Promise<DriverPaymentSummary[]> {
    const driver = getDriverFromReq(req as any);
    return this.service.getPayments(driver.id);
  }

  // ── GET /driver-portal/summary ────────────────────────────────────────────

  @Get('summary')
  @UseGuards(DriverPortalGuard)
  @ApiOkResponse({ type: DriverBalanceSummary })
  @ApiUnauthorizedResponse({ description: 'JWT invalid or driver not linked' })
  getSummary(@Req() req: Request): Promise<DriverBalanceSummary> {
    const driver = getDriverFromReq(req as any);
    return this.service.getSummary(driver.id);
  }
}
