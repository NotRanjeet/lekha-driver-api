import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsPhoneNumber,
  IsEmail,
  IsLatitude,
  IsLongitude,
} from 'class-validator';
import { AvailabilityStatus } from '@prisma/client';

export class UpdateDriverProfileDto {
  @ApiPropertyOptional({ example: 'John' })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({ example: 'Smith' })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({ example: '+61412345678' })
  @IsOptional()
  @IsPhoneNumber()
  phone?: string;

  @ApiPropertyOptional({ example: 'driver@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '1990-01-01' })
  @IsOptional()
  @IsString()
  dateOfBirth?: string;
}

export class UpdateAvailabilityDto {
  @ApiProperty({ enum: AvailabilityStatus, example: AvailabilityStatus.ONLINE })
  @IsEnum(AvailabilityStatus)
  status: AvailabilityStatus;
}

export class UpdateLocationDto {
  @ApiProperty({ example: -33.8688 })
  @IsLatitude()
  latitude: number;

  @ApiProperty({ example: 151.2093 })
  @IsLongitude()
  longitude: number;
}

export class CreateVehicleDto {
  @ApiProperty({ example: 'Toyota' })
  @IsString()
  make: string;

  @ApiProperty({ example: 'Camry' })
  @IsString()
  model: string;

  @ApiProperty({ example: 2022 })
  year: number;

  @ApiProperty({ example: 'White' })
  @IsString()
  color: string;

  @ApiProperty({ example: 'ABC123' })
  @IsString()
  licensePlate: string;

  @ApiPropertyOptional({ example: 4, default: 4 })
  @IsOptional()
  capacity?: number;
}

export class UpdateVehicleDto {
  @ApiPropertyOptional({ example: 'Toyota' })
  @IsOptional()
  @IsString()
  make?: string;

  @ApiPropertyOptional({ example: 'Camry' })
  @IsOptional()
  @IsString()
  model?: string;

  @ApiPropertyOptional({ example: 2022 })
  @IsOptional()
  year?: number;

  @ApiPropertyOptional({ example: 'White' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ example: 'ABC123' })
  @IsOptional()
  @IsString()
  licensePlate?: string;

  @ApiPropertyOptional({ example: 4 })
  @IsOptional()
  capacity?: number;
}
