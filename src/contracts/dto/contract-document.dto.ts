import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ContractDocumentDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  path!: string;

  @ApiPropertyOptional()
  size?: number;

  @ApiPropertyOptional()
  contentType?: string;

  @ApiPropertyOptional()
  lastModified?: string;

  @ApiPropertyOptional()
  documentType?: string;

  @ApiPropertyOptional()
  expiryDate?: string;

  @ApiPropertyOptional()
  createdAt?: string;
}

export class ContractDocumentListResponse {
  @ApiProperty({ type: [ContractDocumentDto] })
  data!: ContractDocumentDto[];

  @ApiProperty({ nullable: true })
  error!: string | null;
}

export class ContractDocumentUrlResponse {
  @ApiProperty()
  url!: string;
}