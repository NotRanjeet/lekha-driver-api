import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ContractCarDto {
  @ApiProperty() id: string;
  @ApiPropertyOptional() make: string | null;
  @ApiPropertyOptional() model: string | null;
  @ApiPropertyOptional() year: number | null;
  @ApiPropertyOptional() registration: string | null;
  @ApiPropertyOptional() color: string | null;
}

export class ContractPriceDto {
  @ApiProperty() id: string;
  @ApiPropertyOptional() name: string | null;
  @ApiProperty() unit_amount: number;
  @ApiProperty() interval: string;
  @ApiProperty() interval_count: number;
}

export class ContractReturnInfoDto {
  @ApiPropertyOptional() return_date: Date | null;
  @ApiPropertyOptional() notice_date: Date | null;
}

export class ContractDto {
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
  @ApiPropertyOptional({ type: ContractCarDto }) cars: ContractCarDto | null;
  @ApiPropertyOptional({ type: ContractPriceDto })
  car_prices: ContractPriceDto | null;
  @ApiPropertyOptional({ type: ContractReturnInfoDto })
  contract_return_info: ContractReturnInfoDto | null;
}
