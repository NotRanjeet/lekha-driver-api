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
import { ContractsService } from './contracts.service';
import { ContractDto } from './dto/contract.dto';

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
}
