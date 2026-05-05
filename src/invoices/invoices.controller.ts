import { Controller, Get, Param, Query, UseGuards, Req } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { Request } from 'express';
import { DriverJwtAuthGuard } from '../auth/guards/driver-jwt-auth.guard';
import {
  DriverPortalGuard,
  getDriverFromReq,
} from '../guards/driver-portal.guard';
import { InvoicesService } from './invoices.service';
import { InvoiceDto, InvoicesSummaryDto } from './dto/invoice.dto';

@ApiTags('Invoices')
@ApiBearerAuth()
@UseGuards(DriverJwtAuthGuard, DriverPortalGuard)
@Controller('invoices')
export class InvoicesController {
  constructor(private readonly service: InvoicesService) {}

  // ── GET /api/invoices/summary ─────────────────────────────────────────────

  @Get('summary')
  @ApiOkResponse({ type: InvoicesSummaryDto })
  @ApiUnauthorizedResponse({ description: 'JWT invalid or driver not linked' })
  getSummary(@Req() req: Request): Promise<InvoicesSummaryDto> {
    const driver = getDriverFromReq(req as any);
    return this.service.getSummary(driver.id);
  }

  // ── GET /api/invoices ─────────────────────────────────────────────────────

  @Get()
  @ApiOkResponse({ type: [InvoiceDto] })
  @ApiUnauthorizedResponse({ description: 'JWT invalid or driver not linked' })
  @ApiQuery({
    name: 'status',
    required: false,
    description:
      'Filter by invoice status (draft|open|paid|uncollectible|overdue|partial). Defaults to all non-void invoices.',
  })
  getInvoices(
    @Req() req: Request,
    @Query('status') status?: string,
  ): Promise<InvoiceDto[]> {
    const driver = getDriverFromReq(req as any);
    return this.service.getInvoices(driver.id, status);
  }

  // ── GET /api/invoices/:id ─────────────────────────────────────────────────

  @Get(':id')
  @ApiOkResponse({ type: InvoiceDto })
  @ApiUnauthorizedResponse({ description: 'JWT invalid or driver not linked' })
  @ApiNotFoundResponse({ description: 'Invoice not found' })
  getInvoice(
    @Req() req: Request,
    @Param('id') id: string,
  ): Promise<InvoiceDto> {
    const driver = getDriverFromReq(req as any);
    return this.service.getInvoice(driver.id, id);
  }
}
