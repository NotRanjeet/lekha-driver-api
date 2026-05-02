import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional } from 'class-validator';
import { DocumentType } from '@prisma/client';

export class UploadDocumentDto {
  @ApiProperty({ enum: DocumentType })
  @IsEnum(DocumentType)
  type: DocumentType;

  @ApiProperty({ description: 'URL of the uploaded document file' })
  @IsString()
  fileUrl: string;

  @ApiPropertyOptional({
    description: 'Document expiry date (ISO 8601)',
    example: '2026-01-01',
  })
  @IsOptional()
  @IsString()
  expiryDate?: string;
}
