import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ─── Credit Application ───────────────────────────────────────────────────────

export class CreditApplicationDto {
  @ApiProperty() id: string;
  @ApiProperty() invoice_id: string;
  @ApiProperty() amount_applied: number;
  @ApiProperty() applied_at: Date;
  @ApiProperty() is_reversed: boolean;
  @ApiPropertyOptional() notes: string | null;
}

// ─── Credit Note ──────────────────────────────────────────────────────────────

export class CreditNoteDto {
  @ApiProperty() id: string;
  @ApiProperty() credit_note_number: string;
  @ApiProperty() created_at: Date;
  @ApiProperty() original_amount: number;
  @ApiProperty({
    description:
      'Remaining balance after applying credits (original_amount minus applied)',
  })
  remaining_amount: number;
  @ApiProperty() currency: string;
  @ApiProperty() reason: string;
  @ApiPropertyOptional() description: string | null;
  @ApiPropertyOptional() reference_number: string | null;
  @ApiProperty() status: string;
  @ApiPropertyOptional() expires_at: Date | null;
  @ApiProperty({ type: [CreditApplicationDto] })
  credit_applications: CreditApplicationDto[];
}

// ─── Credit Notes Summary ─────────────────────────────────────────────────────

export class CreditNotesSummaryDto {
  @ApiProperty({ description: 'Total number of credit notes' })
  credit_notes_count: number;

  @ApiProperty({
    description: 'Sum of original amounts across all credit notes',
  })
  total_amount: number;

  @ApiPropertyOptional({
    description: 'created_at of the most recent credit note',
  })
  last_credit_note_date: Date | null;

  @ApiPropertyOptional({
    description: 'Original amount of the most recent credit note',
  })
  last_credit_note_amount: number | null;
}
