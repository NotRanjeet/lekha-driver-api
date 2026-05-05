import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ─── Invoice Item ─────────────────────────────────────────────────────────────

export class InvoiceItemDto {
  @ApiProperty() id: number;
  @ApiPropertyOptional() description: string | null;
  @ApiProperty() unit_amount: number;
  @ApiProperty() quantity: number;
  @ApiPropertyOptional() gst_percentage: number | null;
}

// ─── Invoice Payment Record ───────────────────────────────────────────────────

export class InvoicePaymentDto {
  @ApiProperty() id: string;
  @ApiProperty() amount: number;
  @ApiProperty() payment_date: Date;
  @ApiPropertyOptional() payment_method: string | null;
  @ApiPropertyOptional() reference_number: string | null;
}

// ─── Invoice ──────────────────────────────────────────────────────────────────

export class InvoiceDto {
  @ApiProperty() id: string;
  @ApiPropertyOptional() invoice_name: string | null;
  @ApiProperty() invoice_status: string;
  @ApiProperty() amount: number;
  @ApiProperty() balance: number;
  @ApiPropertyOptional() period_start: Date | null;
  @ApiPropertyOptional() period_end: Date | null;
  @ApiPropertyOptional() due_date: Date | null;
  @ApiPropertyOptional() expected_payment_date: Date | null;
  @ApiProperty() created_at: Date;
  @ApiPropertyOptional() currency: string | null;
  @ApiProperty({ type: [InvoiceItemDto] }) invoice_item: InvoiceItemDto[];
  @ApiProperty({ type: [InvoicePaymentDto] })
  invoice_payments: InvoicePaymentDto[];
}

// ─── Invoices Summary ─────────────────────────────────────────────────────────

export class InvoicesSummaryDto {
  @ApiProperty({ description: 'Sum of amounts across all invoices' })
  total_invoiced: number;

  @ApiProperty({
    description: 'Sum of balance for all non-paid and non-void invoices',
  })
  pending_balance: number;

  @ApiPropertyOptional({ description: 'created_at of the most recent invoice' })
  last_invoice_date: Date | null;

  @ApiPropertyOptional({ description: 'Amount of the most recent invoice' })
  last_invoice_amount: number | null;
}
