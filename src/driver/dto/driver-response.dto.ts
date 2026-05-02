import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AvailabilityStatus, DriverStatus } from '@prisma/client';

export class VehicleResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  make: string;

  @ApiProperty()
  model: string;

  @ApiProperty()
  year: number;

  @ApiProperty()
  color: string;

  @ApiProperty()
  licensePlate: string;

  @ApiProperty()
  capacity: number;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class DriverProfileResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  phone: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiPropertyOptional()
  profilePhotoUrl?: string | null;

  @ApiPropertyOptional()
  dateOfBirth?: Date | null;

  @ApiProperty({ enum: DriverStatus })
  status: DriverStatus;

  @ApiProperty({ enum: AvailabilityStatus })
  availabilityStatus: AvailabilityStatus;

  @ApiPropertyOptional()
  currentLatitude?: number | null;

  @ApiPropertyOptional()
  currentLongitude?: number | null;

  @ApiProperty()
  rating: number;

  @ApiProperty()
  totalTrips: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional({ type: VehicleResponseDto })
  vehicle?: VehicleResponseDto | null;
}

export class AvailabilityResponseDto {
  @ApiProperty({ enum: AvailabilityStatus })
  availabilityStatus: AvailabilityStatus;

  @ApiProperty()
  updatedAt: Date;
}

export class LocationUpdateResponseDto {
  @ApiProperty()
  message: string;
}
