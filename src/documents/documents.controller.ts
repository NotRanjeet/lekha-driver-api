import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { DocumentsService } from './documents.service';
import { UploadDocumentDto } from './dto/document.dto';
import {
  DocumentResponseDto,
  DocumentStatusSummaryDto,
} from './dto/document-response.dto';
import { CurrentDriver } from '../common/decorators/current-driver.decorator';
import { DocumentType } from '@prisma/client';

@ApiTags('Documents')
@ApiBearerAuth()
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Get()
  @ApiOperation({
    summary: 'Get all driver documents and their verification status',
  })
  @ApiResponse({
    status: 200,
    description: 'Document status summary',
    type: DocumentStatusSummaryDto,
  })
  async getAllDocuments(
    @CurrentDriver('id') driverId: string,
  ): Promise<DocumentStatusSummaryDto> {
    return this.documentsService.getAllDocuments(driverId);
  }

  @Get(':type')
  @ApiOperation({ summary: 'Get a specific document by type' })
  @ApiParam({ name: 'type', enum: DocumentType })
  @ApiResponse({
    status: 200,
    description: 'Document details',
    type: DocumentResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Document not found' })
  async getDocumentByType(
    @CurrentDriver('id') driverId: string,
    @Param('type') type: DocumentType,
  ): Promise<DocumentResponseDto> {
    return this.documentsService.getDocumentByType(driverId, type);
  }

  @Post()
  @ApiOperation({ summary: 'Upload or re-upload a document for verification' })
  @ApiResponse({
    status: 201,
    description: 'Document uploaded and pending review',
    type: DocumentResponseDto,
  })
  async uploadDocument(
    @CurrentDriver('id') driverId: string,
    @Body() dto: UploadDocumentDto,
  ): Promise<DocumentResponseDto> {
    return this.documentsService.uploadDocument(driverId, dto);
  }
}
