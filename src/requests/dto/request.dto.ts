import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsUUID,
  IsOptional,
  MaxLength,
  MinLength,
} from 'class-validator';
import { driver_request_status, driver_request_severity } from '@prisma/client';

// ─── Request DTOs ─────────────────────────────────────────────────────────────

export class CreateDriverRequestDto {
  @ApiProperty({ description: 'Active category UUID for this company' })
  @IsUUID()
  category_id: string;

  @ApiProperty({ description: 'Short summary of the request', maxLength: 255 })
  @IsString()
  @MaxLength(255)
  title: string;

  @ApiPropertyOptional({ description: 'Detailed description' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class AddCommentDto {
  @ApiProperty({ description: 'Comment text', minLength: 1 })
  @IsString()
  @MinLength(1)
  comment: string;
}

// ─── Response DTOs ────────────────────────────────────────────────────────────

export class DriverRequestCategoryResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiPropertyOptional() description: string | null;
  @ApiProperty({ enum: driver_request_severity })
  default_severity: driver_request_severity;
  @ApiProperty() is_active: boolean;
  @ApiProperty() created_at: Date;
  @ApiProperty() updated_at: Date;
}

export class DriverRequestSummaryDto {
  @ApiProperty() id: string;
  @ApiProperty() title: string;
  @ApiProperty({ enum: driver_request_status }) status: driver_request_status;
  @ApiProperty({ enum: driver_request_severity })
  severity: driver_request_severity;
  @ApiProperty() category_id: string;
  @ApiProperty() category_name: string;
  @ApiProperty() driver_id: string;
  @ApiPropertyOptional() description: string | null;
  @ApiPropertyOptional() assigned_to: string | null;
  @ApiProperty() created_at: Date;
  @ApiProperty() updated_at: Date;
}

export class DriverRequestCommentDto {
  @ApiProperty() id: string;
  @ApiProperty() request_id: string;
  @ApiProperty() comment: string;
  @ApiProperty() is_staff_comment: boolean;
  @ApiPropertyOptional() author_driver_id: string | null;
  @ApiPropertyOptional() author_user_id: string | null;
  @ApiProperty() created_at: Date;
}

export class DriverRequestStatusHistoryDto {
  @ApiProperty() id: string;
  @ApiProperty() request_id: string;
  @ApiPropertyOptional({ enum: driver_request_status })
  from_status: driver_request_status | null;
  @ApiProperty({ enum: driver_request_status })
  to_status: driver_request_status;
  @ApiPropertyOptional() changed_by: string | null;
  @ApiPropertyOptional() note: string | null;
  @ApiPropertyOptional() duration_ms: string | null;
  @ApiProperty() created_at: Date;
}

export class DriverRequestDetailDto extends DriverRequestSummaryDto {
  @ApiPropertyOptional() resolved_at: Date | null;
  @ApiPropertyOptional() resolved_by: string | null;
  @ApiPropertyOptional() resolve_comment: string | null;
  @ApiProperty({ type: [DriverRequestCommentDto] })
  comments: DriverRequestCommentDto[];
  @ApiProperty({ type: [DriverRequestStatusHistoryDto] })
  status_history: DriverRequestStatusHistoryDto[];
}
