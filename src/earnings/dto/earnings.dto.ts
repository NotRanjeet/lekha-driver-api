import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class EarningsQueryDto {
  @ApiPropertyOptional({
    description: 'Start date (ISO 8601)',
    example: '2024-01-01',
  })
  @IsOptional()
  @IsString()
  from?: string;

  @ApiPropertyOptional({
    description: 'End date (ISO 8601)',
    example: '2024-01-31',
  })
  @IsOptional()
  @IsString()
  to?: string;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ description: 'Items per page', default: 20 })
  @IsOptional()
  limit?: number;
}
