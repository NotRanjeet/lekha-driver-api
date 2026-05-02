import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { EarningsService } from './earnings.service';
import { EarningsQueryDto } from './dto/earnings.dto';
import {
  EarningsSummaryDto,
  EarningsListResponseDto,
  PayoutListResponseDto,
} from './dto/earnings-response.dto';
import { CurrentDriver } from '../common/decorators/current-driver.decorator';

@ApiTags('Earnings')
@ApiBearerAuth()
@Controller('earnings')
export class EarningsController {
  constructor(private readonly earningsService: EarningsService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Get earnings summary for a date range' })
  @ApiResponse({
    status: 200,
    description: 'Earnings summary',
    type: EarningsSummaryDto,
  })
  async getSummary(
    @CurrentDriver('id') driverId: string,
    @Query() query: EarningsQueryDto,
  ): Promise<EarningsSummaryDto> {
    return this.earningsService.getSummary(driverId, query);
  }

  @Get()
  @ApiOperation({ summary: 'Get paginated earnings history' })
  @ApiResponse({
    status: 200,
    description: 'Earnings history',
    type: EarningsListResponseDto,
  })
  async getEarningsHistory(
    @CurrentDriver('id') driverId: string,
    @Query() query: EarningsQueryDto,
  ): Promise<EarningsListResponseDto> {
    return this.earningsService.getEarningsHistory(driverId, query);
  }

  @Get('payouts')
  @ApiOperation({ summary: 'Get paginated payout history' })
  @ApiResponse({
    status: 200,
    description: 'Payout history',
    type: PayoutListResponseDto,
  })
  async getPayouts(
    @CurrentDriver('id') driverId: string,
    @Query() query: EarningsQueryDto,
  ): Promise<PayoutListResponseDto> {
    return this.earningsService.getPayouts(driverId, query);
  }
}
