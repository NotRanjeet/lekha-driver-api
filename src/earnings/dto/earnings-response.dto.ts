import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PayoutStatus } from '@prisma/client';

export class EarningResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  driverId: string;

  @ApiProperty()
  tripId: string;

  @ApiProperty()
  grossAmount: number;

  @ApiProperty()
  platformFee: number;

  @ApiProperty()
  netAmount: number;

  @ApiProperty()
  currency: string;

  @ApiProperty()
  isPaid: boolean;

  @ApiPropertyOptional()
  paidAt: Date | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class EarningsSummaryDto {
  @ApiProperty({ description: 'Total gross earnings in the period' })
  totalGross: number;

  @ApiProperty({ description: 'Total platform fees in the period' })
  totalPlatformFee: number;

  @ApiProperty({ description: 'Total net earnings in the period' })
  totalNet: number;

  @ApiProperty({ description: 'Total unpaid net earnings' })
  pendingPayment: number;

  @ApiProperty({ description: 'Number of trips in the period' })
  tripCount: number;

  @ApiProperty({ description: 'Currency code' })
  currency: string;
}

export class EarningsListResponseDto {
  @ApiProperty({ type: [EarningResponseDto] })
  items: EarningResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;
}

export class PayoutResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  driverId: string;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  currency: string;

  @ApiProperty({ enum: PayoutStatus })
  status: PayoutStatus;

  @ApiPropertyOptional()
  bankAccountId: string | null;

  @ApiPropertyOptional()
  reference: string | null;

  @ApiPropertyOptional()
  processedAt: Date | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class PayoutListResponseDto {
  @ApiProperty({ type: [PayoutResponseDto] })
  items: PayoutResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;
}
