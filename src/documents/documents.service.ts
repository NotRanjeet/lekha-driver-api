import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DocumentStatus, DocumentType } from '@prisma/client';
import { UploadDocumentDto } from './dto/document.dto';
import {
  DocumentResponseDto,
  DocumentStatusSummaryDto,
} from './dto/document-response.dto';

const REQUIRED_DOCUMENTS: DocumentType[] = [
  DocumentType.DRIVERS_LICENSE,
  DocumentType.VEHICLE_REGISTRATION,
  DocumentType.VEHICLE_INSURANCE,
];

@Injectable()
export class DocumentsService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllDocuments(driverId: string): Promise<DocumentStatusSummaryDto> {
    const documents = await this.prisma.document.findMany({
      where: { driverId },
      orderBy: { type: 'asc' },
    });

    const allApproved = REQUIRED_DOCUMENTS.every((type) =>
      documents.some(
        (d) => d.type === type && d.status === DocumentStatus.APPROVED,
      ),
    );

    return { allApproved, documents };
  }

  async getDocumentByType(
    driverId: string,
    type: DocumentType,
  ): Promise<DocumentResponseDto> {
    const document = await this.prisma.document.findUnique({
      where: { driverId_type: { driverId, type } },
    });

    if (!document) {
      throw new NotFoundException(`Document of type ${type} not found`);
    }

    return document;
  }

  async uploadDocument(
    driverId: string,
    dto: UploadDocumentDto,
  ): Promise<DocumentResponseDto> {
    const document = await this.prisma.document.upsert({
      where: { driverId_type: { driverId, type: dto.type } },
      create: {
        driverId,
        type: dto.type,
        fileUrl: dto.fileUrl,
        status: DocumentStatus.PENDING,
        expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : null,
      },
      update: {
        fileUrl: dto.fileUrl,
        status: DocumentStatus.PENDING, // reset to pending on re-upload
        expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : null,
        rejectedNote: null,
        reviewedAt: null,
      },
    });

    return document;
  }
}
