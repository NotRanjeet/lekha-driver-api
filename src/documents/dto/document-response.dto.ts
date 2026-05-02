import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DocumentStatus, DocumentType } from '@prisma/client';

export class DocumentResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  driverId: string;

  @ApiProperty({ enum: DocumentType })
  type: DocumentType;

  @ApiProperty({ enum: DocumentStatus })
  status: DocumentStatus;

  @ApiProperty()
  fileUrl: string;

  @ApiPropertyOptional()
  expiryDate: Date | null;

  @ApiPropertyOptional()
  rejectedNote: string | null;

  @ApiPropertyOptional()
  reviewedAt: Date | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class DocumentStatusSummaryDto {
  @ApiProperty({ description: 'True when all required documents are approved' })
  allApproved: boolean;

  @ApiProperty({ type: [DocumentResponseDto] })
  documents: DocumentResponseDto[];
}
