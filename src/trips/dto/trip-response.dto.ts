import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod, TripStatus } from '@prisma/client';

export class TripResponseDto {
  @ApiProperty()
  id: string;

  @ApiPropertyOptional()
  driverId: string | null;

  @ApiProperty()
  passengerId: string;

  @ApiProperty({ enum: TripStatus })
  status: TripStatus;

  @ApiProperty()
  pickupAddress: string;

  @ApiProperty()
  pickupLatitude: number;

  @ApiProperty()
  pickupLongitude: number;

  @ApiProperty()
  dropoffAddress: string;

  @ApiProperty()
  dropoffLatitude: number;

  @ApiProperty()
  dropoffLongitude: number;

  @ApiPropertyOptional()
  estimatedDistance: number | null;

  @ApiPropertyOptional({ description: 'Estimated duration in minutes' })
  estimatedDuration: number | null;

  @ApiPropertyOptional()
  actualDistance: number | null;

  @ApiPropertyOptional({ description: 'Actual duration in minutes' })
  actualDuration: number | null;

  @ApiPropertyOptional()
  baseFare: number | null;

  @ApiPropertyOptional()
  totalFare: number | null;

  @ApiProperty({ enum: PaymentMethod })
  paymentMethod: PaymentMethod;

  @ApiPropertyOptional()
  passengerRating: number | null;

  @ApiPropertyOptional()
  driverRating: number | null;

  @ApiPropertyOptional()
  cancellationReason: string | null;

  @ApiPropertyOptional()
  cancelledBy: string | null;

  @ApiProperty()
  requestedAt: Date;

  @ApiPropertyOptional()
  acceptedAt: Date | null;

  @ApiPropertyOptional()
  driverArrivedAt: Date | null;

  @ApiPropertyOptional()
  startedAt: Date | null;

  @ApiPropertyOptional()
  completedAt: Date | null;

  @ApiPropertyOptional()
  cancelledAt: Date | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class TripListResponseDto {
  @ApiProperty({ type: [TripResponseDto] })
  items: TripResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;
}
