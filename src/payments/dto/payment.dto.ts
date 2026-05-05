import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ─── Payment ──────────────────────────────────────────────────────────────────

export class PaymentInvoiceRefDto {
  @ApiProperty() id: string;
  @ApiPropertyOptional() invoice_name: string | null;
  @ApiProperty() invoice_status: string;
}

export class PaymentDto {
  @ApiProperty() id: string;
  @ApiProperty() amount: number;
  @ApiProperty() payment_date: Date;
  @ApiPropertyOptional() payment_method: string | null;
  @ApiPropertyOptional() reference_number: string | null;
  @ApiPropertyOptional() notes: string | null;
  @ApiProperty({ type: PaymentInvoiceRefDto }) invoice: PaymentInvoiceRefDto;
}

// ─── Payments Summary ─────────────────────────────────────────────────────────

export class PaymentsSummaryDto {
  @ApiPropertyOptional({ description: 'Date of the most recent payment' })
  last_payment_date: Date | null;

  @ApiPropertyOptional({ description: 'Amount of the most recent payment' })
  last_payment_amount: number | null;

  @ApiProperty({ description: 'Total number of payments made' })
  total_payment_count: number;

  @ApiProperty({ description: 'Sum of all payments made' })
  total_payment_sum: number;
}
