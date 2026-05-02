import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { DriverService } from './driver.service';
import {
  UpdateDriverProfileDto,
  UpdateAvailabilityDto,
  UpdateLocationDto,
  CreateVehicleDto,
  UpdateVehicleDto,
} from './dto/driver.dto';
import {
  DriverProfileResponseDto,
  VehicleResponseDto,
  AvailabilityResponseDto,
  LocationUpdateResponseDto,
} from './dto/driver-response.dto';
import { CurrentDriver } from '../common/decorators/current-driver.decorator';

@ApiTags('Driver')
@ApiBearerAuth()
@Controller('driver')
export class DriverController {
  constructor(private readonly driverService: DriverService) {}

  // ─── Profile ──────────────────────────────────────────────────────────────

  @Get('profile')
  @ApiOperation({ summary: 'Get the current driver profile' })
  @ApiResponse({
    status: 200,
    description: 'Driver profile',
    type: DriverProfileResponseDto,
  })
  async getProfile(
    @CurrentDriver('id') driverId: string,
  ): Promise<DriverProfileResponseDto> {
    return this.driverService.getProfile(driverId);
  }

  @Patch('profile')
  @ApiOperation({ summary: 'Update driver profile details' })
  @ApiResponse({
    status: 200,
    description: 'Updated driver profile',
    type: DriverProfileResponseDto,
  })
  @ApiResponse({ status: 409, description: 'Email or phone already in use' })
  async updateProfile(
    @CurrentDriver('id') driverId: string,
    @Body() dto: UpdateDriverProfileDto,
  ): Promise<DriverProfileResponseDto> {
    return this.driverService.updateProfile(driverId, dto);
  }

  // ─── Availability ─────────────────────────────────────────────────────────

  @Patch('availability')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update driver availability status (ONLINE/OFFLINE)',
  })
  @ApiResponse({
    status: 200,
    description: 'Availability updated',
    type: AvailabilityResponseDto,
  })
  async updateAvailability(
    @CurrentDriver('id') driverId: string,
    @Body() dto: UpdateAvailabilityDto,
  ): Promise<AvailabilityResponseDto> {
    return this.driverService.updateAvailability(driverId, dto);
  }

  // ─── Location ─────────────────────────────────────────────────────────────

  @Patch('location')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update driver current GPS location' })
  @ApiResponse({
    status: 200,
    description: 'Location updated',
    type: LocationUpdateResponseDto,
  })
  async updateLocation(
    @CurrentDriver('id') driverId: string,
    @Body() dto: UpdateLocationDto,
  ): Promise<LocationUpdateResponseDto> {
    await this.driverService.updateLocation(driverId, dto);
    return { message: 'Location updated successfully' };
  }

  // ─── Vehicle ──────────────────────────────────────────────────────────────

  @Get('vehicle')
  @ApiOperation({ summary: "Get the driver's registered vehicle" })
  @ApiResponse({
    status: 200,
    description: 'Vehicle details',
    type: VehicleResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Vehicle not found' })
  async getVehicle(
    @CurrentDriver('id') driverId: string,
  ): Promise<VehicleResponseDto> {
    return this.driverService.getVehicle(driverId);
  }

  @Post('vehicle')
  @ApiOperation({ summary: 'Register a vehicle for the driver' })
  @ApiResponse({
    status: 201,
    description: 'Vehicle registered',
    type: VehicleResponseDto,
  })
  @ApiResponse({
    status: 409,
    description:
      'License plate already registered or driver already has a vehicle',
  })
  async createVehicle(
    @CurrentDriver('id') driverId: string,
    @Body() dto: CreateVehicleDto,
  ): Promise<VehicleResponseDto> {
    return this.driverService.createVehicle(driverId, dto);
  }

  @Patch('vehicle')
  @ApiOperation({ summary: "Update the driver's vehicle details" })
  @ApiResponse({
    status: 200,
    description: 'Vehicle updated',
    type: VehicleResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Vehicle not found' })
  async updateVehicle(
    @CurrentDriver('id') driverId: string,
    @Body() dto: UpdateVehicleDto,
  ): Promise<VehicleResponseDto> {
    return this.driverService.updateVehicle(driverId, dto);
  }
}
