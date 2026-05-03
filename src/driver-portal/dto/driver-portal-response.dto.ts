import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ─── Driver Profile ───────────────────────────────────────────────────────────

export class DriverProfileResponse {
  @ApiProperty() id: string;
  @ApiProperty() first_name: string;
  @ApiProperty() last_name: string;
  @ApiPropertyOptional() email: string | null;
  @ApiPropertyOptional() mobile: string | null;
  @ApiPropertyOptional() dob: Date | null;
  @ApiPropertyOptional() license_number: string | null;
  @ApiPropertyOptional() license_expiry: Date | null;
  @ApiPropertyOptional() license_state: string | null;
  @ApiPropertyOptional() license_country: string | null;
  @ApiPropertyOptional() address_line_one: string | null;
  @ApiPropertyOptional() address_line_two: string | null;
  @ApiPropertyOptional() address_suburb: string | null;
  @ApiPropertyOptional() address_state: string | null;
  @ApiPropertyOptional() address_post_code: string | null;
  @ApiPropertyOptional() address_country: string | null;
  @ApiPropertyOptional() emergency_name: string | null;
  @ApiPropertyOptional() emergency_phone: string | null;
  @ApiPropertyOptional() emergency_relation: string | null;
  @ApiPropertyOptional() business_name: string | null;
  @ApiPropertyOptional() business_abn: string | null;
  @ApiPropertyOptional() card_last_four: string | null;
  @ApiPropertyOptional() card_expiry_month: number | null;
  @ApiPropertyOptional() card_expiry_year: number | null;
  @ApiProperty() created_at: Date;
}

// ─── Contract ─────────────────────────────────────────────────────────────────

export class ContractCarSummary {
  @ApiProperty() id: string;
  @ApiPropertyOptional() make: string | null;
  @ApiPropertyOptional() model: string | null;
  @ApiPropertyOptional() year: number | null;
  @ApiPropertyOptional() registration: string | null;
  @ApiPropertyOptional() color: string | null;
}

export class ContractPriceSummary {
  @ApiProperty() id: string;
  @ApiPropertyOptional() name: string | null;
  @ApiProperty() unit_amount: number;
  @ApiProperty() interval: string;
  @ApiProperty() interval_count: number;
}

export class ContractReturnInfoSummary {
  @ApiPropertyOptional() return_date: Date | null;
  @ApiPropertyOptional() notice_date: Date | null;
}

export class DriverContractSummary {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiProperty() type: string;
  @ApiProperty() start_date: Date;
  @ApiPropertyOptional() end_date: Date | null;
  @ApiProperty() length_in_weeks: number;
  @ApiPropertyOptional() allowed_kms_per_week: number | null;
  @ApiPropertyOptional() preferred_payment_day: string | null;
  @ApiProperty() is_manual_payment: boolean;
  @ApiPropertyOptional() intended_use: string | null;
  @ApiPropertyOptional() fuel_level: string | null;
  @ApiPropertyOptional() deposit_received: number | null;
  @ApiPropertyOptional({ type: ContractCarSummary })
  cars: ContractCarSummary | null;
  @ApiPropertyOptional({ type: ContractPriceSummary })
  car_prices: ContractPriceSummary | null;
  @ApiPropertyOptional({ type: ContractReturnInfoSummary })
  contract_return_info: ContractReturnInfoSummary | null;
}

// ─── Invoice ──────────────────────────────────────────────────────────────────

export class InvoiceItemSummary {
  @ApiProperty() id: number;
  @ApiPropertyOptional() description: string | null;
  @ApiProperty() unit_amount: number;
  @ApiProperty() quantity: number;
  @ApiPropertyOptional() gst_percentage: number | null;
}

export class InvoicePaymentRecord {
  @ApiProperty() id: string;
  @ApiProperty() amount: number;
  @ApiProperty() payment_date: Date;
  @ApiPropertyOptional() payment_method: string | null;
  @ApiPropertyOptional() reference_number: string | null;
}

export class DriverInvoiceSummary {
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
  @ApiProperty({ type: [InvoiceItemSummary] })
  invoice_item: InvoiceItemSummary[];
  @ApiProperty({ type: [InvoicePaymentRecord] })
  invoice_payments: InvoicePaymentRecord[];
}

// ─── Payment ──────────────────────────────────────────────────────────────────

export class InvoiceRef {
  @ApiProperty() id: string;
  @ApiPropertyOptional() invoice_name: string | null;
  @ApiProperty() invoice_status: string;
}

export class DriverPaymentSummary {
  @ApiProperty() id: string;
  @ApiProperty() amount: number;
  @ApiProperty() payment_date: Date;
  @ApiPropertyOptional() payment_method: string | null;
  @ApiPropertyOptional() reference_number: string | null;
  @ApiPropertyOptional() notes: string | null;
  @ApiProperty({ type: InvoiceRef }) invoice: InvoiceRef;
}

// ─── Balance Summary ──────────────────────────────────────────────────────────

export class ActiveContractInfo {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiProperty() start_date: Date;
  @ApiPropertyOptional() preferred_payment_day: string | null;
  @ApiPropertyOptional() payment_amount: number | null;
  @ApiPropertyOptional() payment_interval: string | null;
  @ApiPropertyOptional() payment_interval_count: number | null;
}

export class DriverBalanceSummary {
  @ApiProperty() total_invoiced: number;
  @ApiProperty() total_paid: number;
  @ApiProperty() total_outstanding: number;
  @ApiPropertyOptional({ type: ActiveContractInfo })
  active_contract: ActiveContractInfo | null;
}
