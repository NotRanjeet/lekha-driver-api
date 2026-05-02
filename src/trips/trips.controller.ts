import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { TripsService } from './trips.service';
import {
  AcceptTripDto,
  CancelTripDto,
  RateTripDto,
  TripQueryDto,
} from './dto/trip.dto';
import { TripResponseDto, TripListResponseDto } from './dto/trip-response.dto';
import { CurrentDriver } from '../common/decorators/current-driver.decorator';

@ApiTags('Trips')
@ApiBearerAuth()
@Controller('trips')
export class TripsController {
  constructor(private readonly tripsService: TripsService) {}

  @Get('active')
  @ApiOperation({ summary: 'Get current active trip (if any)' })
  @ApiResponse({
    status: 200,
    description: 'Active trip or null',
    type: TripResponseDto,
  })
  async getActiveTrip(
    @CurrentDriver('id') driverId: string,
  ): Promise<TripResponseDto | null> {
    return this.tripsService.getActiveTrip(driverId);
  }

  @Get('history')
  @ApiOperation({
    summary:
      'Get driver trip history with optional status filter and pagination',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated trip history',
    type: TripListResponseDto,
  })
  async getTripHistory(
    @CurrentDriver('id') driverId: string,
    @Query() query: TripQueryDto,
  ): Promise<TripListResponseDto> {
    return this.tripsService.getTripHistory(driverId, query);
  }

  @Get(':tripId')
  @ApiOperation({ summary: 'Get a specific trip by ID' })
  @ApiParam({ name: 'tripId', description: 'Trip ID' })
  @ApiResponse({
    status: 200,
    description: 'Trip details',
    type: TripResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Trip not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async getTripById(
    @CurrentDriver('id') driverId: string,
    @Param('tripId') tripId: string,
  ): Promise<TripResponseDto> {
    return this.tripsService.getTripById(driverId, tripId);
  }

  @Post('accept')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Accept a trip request' })
  @ApiResponse({
    status: 200,
    description: 'Trip accepted',
    type: TripResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Trip no longer available or driver has active trip',
  })
  @ApiResponse({ status: 404, description: 'Trip not found' })
  async acceptTrip(
    @CurrentDriver('id') driverId: string,
    @Body() dto: AcceptTripDto,
  ): Promise<TripResponseDto> {
    return this.tripsService.acceptTrip(driverId, dto);
  }

  @Patch(':tripId/arrive')
  @ApiOperation({ summary: 'Mark arrival at pickup location' })
  @ApiParam({ name: 'tripId', description: 'Trip ID' })
  @ApiResponse({
    status: 200,
    description: 'Arrival marked',
    type: TripResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid trip state' })
  async arriveAtPickup(
    @CurrentDriver('id') driverId: string,
    @Param('tripId') tripId: string,
  ): Promise<TripResponseDto> {
    return this.tripsService.arriveAtPickup(driverId, tripId);
  }

  @Patch(':tripId/start')
  @ApiOperation({ summary: 'Start the trip (passenger picked up)' })
  @ApiParam({ name: 'tripId', description: 'Trip ID' })
  @ApiResponse({
    status: 200,
    description: 'Trip started',
    type: TripResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid trip state' })
  async startTrip(
    @CurrentDriver('id') driverId: string,
    @Param('tripId') tripId: string,
  ): Promise<TripResponseDto> {
    return this.tripsService.startTrip(driverId, tripId);
  }

  @Patch(':tripId/complete')
  @ApiOperation({ summary: 'Complete the trip (passenger dropped off)' })
  @ApiParam({ name: 'tripId', description: 'Trip ID' })
  @ApiResponse({
    status: 200,
    description: 'Trip completed',
    type: TripResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid trip state' })
  async completeTrip(
    @CurrentDriver('id') driverId: string,
    @Param('tripId') tripId: string,
  ): Promise<TripResponseDto> {
    return this.tripsService.completeTrip(driverId, tripId);
  }

  @Patch(':tripId/cancel')
  @ApiOperation({ summary: 'Cancel an accepted trip' })
  @ApiParam({ name: 'tripId', description: 'Trip ID' })
  @ApiResponse({
    status: 200,
    description: 'Trip cancelled',
    type: TripResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Trip cannot be cancelled in current state',
  })
  async cancelTrip(
    @CurrentDriver('id') driverId: string,
    @Param('tripId') tripId: string,
    @Body() dto: CancelTripDto,
  ): Promise<TripResponseDto> {
    return this.tripsService.cancelTrip(driverId, tripId, dto);
  }

  @Post(':tripId/rate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rate the passenger after trip completion' })
  @ApiParam({ name: 'tripId', description: 'Trip ID' })
  @ApiResponse({
    status: 200,
    description: 'Rating submitted',
    type: TripResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Trip not completed or already rated',
  })
  async ratePassenger(
    @CurrentDriver('id') driverId: string,
    @Param('tripId') tripId: string,
    @Body() dto: RateTripDto,
  ): Promise<TripResponseDto> {
    return this.tripsService.ratePassenger(driverId, tripId, dto);
  }
}
