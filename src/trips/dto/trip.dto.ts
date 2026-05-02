import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNumber,
  Min,
  Max,
  IsEnum,
} from 'class-validator';
import { TripStatus } from '@prisma/client';

export class AcceptTripDto {
  @ApiProperty({ description: 'Trip ID to accept' })
  @IsString()
  tripId: string;
}

export class CancelTripDto {
  @ApiProperty({ description: 'Reason for cancellation' })
  @IsString()
  reason: string;
}

export class RateTripDto {
  @ApiProperty({
    description: 'Rating for the passenger (1-5)',
    minimum: 1,
    maximum: 5,
  })
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiPropertyOptional({ description: 'Optional note about the trip' })
  @IsOptional()
  @IsString()
  note?: string;
}

export class TripQueryDto {
  @ApiPropertyOptional({ enum: TripStatus })
  @IsOptional()
  @IsEnum(TripStatus)
  status?: TripStatus;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: 'Items per page', default: 20 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;
}
