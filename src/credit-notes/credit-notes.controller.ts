import { Controller, Get, Param, UseGuards, Req } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOkResponse,
  ApiUnauthorizedResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { Request } from 'express';
import { DriverJwtAuthGuard } from '../auth/guards/driver-jwt-auth.guard';
import {
  DriverPortalGuard,
  getDriverFromReq,
} from '../guards/driver-portal.guard';
import { CreditNotesService } from './credit-notes.service';
import { CreditNoteDto, CreditNotesSummaryDto } from './dto/credit-note.dto';

@ApiTags('Credit Notes')
@ApiBearerAuth()
@UseGuards(DriverJwtAuthGuard, DriverPortalGuard)
@Controller('credit-notes')
export class CreditNotesController {
  constructor(private readonly service: CreditNotesService) {}

  // ── GET /api/credit-notes/summary ─────────────────────────────────────────

  @Get('summary')
  @ApiOkResponse({ type: CreditNotesSummaryDto })
  @ApiUnauthorizedResponse({ description: 'JWT invalid or driver not linked' })
  getSummary(@Req() req: Request): Promise<CreditNotesSummaryDto> {
    const driver = getDriverFromReq(req as any);
    return this.service.getSummary(driver.id);
  }

  // ── GET /api/credit-notes ─────────────────────────────────────────────────

  @Get()
  @ApiOkResponse({ type: [CreditNoteDto] })
  @ApiUnauthorizedResponse({ description: 'JWT invalid or driver not linked' })
  getCreditNotes(@Req() req: Request): Promise<CreditNoteDto[]> {
    const driver = getDriverFromReq(req as any);
    return this.service.getCreditNotes(driver.id);
  }

  // ── GET /api/credit-notes/:id ─────────────────────────────────────────────

  @Get(':id')
  @ApiOkResponse({ type: CreditNoteDto })
  @ApiUnauthorizedResponse({ description: 'JWT invalid or driver not linked' })
  @ApiNotFoundResponse({ description: 'Credit note not found' })
  getCreditNote(
    @Req() req: Request,
    @Param('id') id: string,
  ): Promise<CreditNoteDto> {
    const driver = getDriverFromReq(req as any);
    return this.service.getCreditNote(driver.id, id);
  }
}
