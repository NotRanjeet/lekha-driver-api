import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOkResponse,
  ApiUnauthorizedResponse,
  ApiNotFoundResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { Request } from 'express';
import { DriverJwtAuthGuard } from '../auth/guards/driver-jwt-auth.guard';
import {
  DriverPortalGuard,
  getDriverFromReq,
} from '../guards/driver-portal.guard';
import { ContractsService } from './contracts.service';
import { ContractDto } from './dto/contract.dto';
import {
  ContractDocumentListResponse,
  ContractDocumentUrlResponse,
} from './dto/contract-document.dto';

@ApiTags('Contracts')
@ApiBearerAuth()
@UseGuards(DriverJwtAuthGuard, DriverPortalGuard)
@Controller('contracts')
export class ContractsController {
  constructor(private readonly service: ContractsService) {}

  // ── GET /api/contracts ────────────────────────────────────────────────────

  @Get()
  @ApiOkResponse({ type: [ContractDto] })
  @ApiUnauthorizedResponse({ description: 'JWT invalid or driver not linked' })
  getContracts(@Req() req: Request): Promise<ContractDto[]> {
    const driver = getDriverFromReq(req as any);
    return this.service.getContracts(driver.id);
  }

  // ── GET /api/contracts/:id ────────────────────────────────────────────────

  @Get(':id')
  @ApiOkResponse({ type: ContractDto })
  @ApiUnauthorizedResponse({ description: 'JWT invalid or driver not linked' })
  @ApiNotFoundResponse({ description: 'Contract not found' })
  getContract(
    @Req() req: Request,
    @Param('id') id: string,
  ): Promise<ContractDto> {
    const driver = getDriverFromReq(req as any);
    return this.service.getContract(driver.id, id);
  }

  // ── GET /api/contracts/:id/documents ──────────────────────────────────────

  @Get(':id/documents')
  @ApiOkResponse({ type: ContractDocumentListResponse })
  @ApiUnauthorizedResponse({ description: 'JWT invalid or driver not linked' })
  @ApiNotFoundResponse({ description: 'Contract not found' })
  getContractDocuments(
    @Req() req: Request,
    @Param('id') id: string,
  ): Promise<ContractDocumentListResponse> {
    const driver = getDriverFromReq(req as any);
    return this.service.getContractDocuments(driver.id, id);
  }

  // ── GET /api/contracts/:id/documents/:fileId/download ─────────────────────

  @Get(':id/documents/:fileId/download')
  @ApiOkResponse({ type: ContractDocumentUrlResponse })
  @ApiUnauthorizedResponse({ description: 'JWT invalid or driver not linked' })
  @ApiNotFoundResponse({ description: 'Contract or document not found' })
  @ApiQuery({
    name: 'download',
    required: false,
    description: 'Whether to force download (true) or inline preview (false)',
  })
  downloadContractDocument(
    @Req() req: Request,
    @Param('id') id: string,
    @Param('fileId') fileId: string,
    @Query('download') download?: string,
  ): Promise<ContractDocumentUrlResponse> {
    const driver = getDriverFromReq(req as any);
    const downloadFlag = download === 'true';
    return this.service.generateDocumentUrl(
      driver.id,
      id,
      fileId,
      downloadFlag,
    );
  }
}