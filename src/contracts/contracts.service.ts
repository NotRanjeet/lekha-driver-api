import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../common/database/prisma.service';
import { StorageService } from '../common/services/storage.service';
import { ContractDto } from './dto/contract.dto';
import {
  ContractDocumentDto,
  ContractDocumentListResponse,
  ContractDocumentUrlResponse,
} from './dto/contract-document.dto';

@Injectable()
export class ContractsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async getContracts(driverId: string): Promise<ContractDto[]> {
    const contracts = await this.prisma.contracts.findMany({
      where: { driver_id: driverId },
      orderBy: { start_date: 'desc' },
      include: {
        cars: {
          select: {
            id: true,
            make: true,
            model: true,
            year: true,
            registration: true,
            color: true,
          },
        },
        car_prices: {
          select: {
            id: true,
            name: true,
            unit_amount: true,
            interval: true,
            interval_count: true,
          },
        },
        contract_return_info: {
          select: { return_date: true, notice_date: true },
        },
      },
    });

    return contracts.map((c) => this.mapContract(c));
  }

  async getContract(
    driverId: string,
    contractId: string,
  ): Promise<ContractDto> {
    const c = await this.prisma.contracts.findFirst({
      where: { id: contractId, driver_id: driverId },
      include: {
        cars: {
          select: {
            id: true,
            make: true,
            model: true,
            year: true,
            registration: true,
            color: true,
          },
        },
        car_prices: {
          select: {
            id: true,
            name: true,
            unit_amount: true,
            interval: true,
            interval_count: true,
          },
        },
        contract_return_info: {
          select: { return_date: true, notice_date: true },
        },
      },
    });

    if (!c) {
      throw new NotFoundException(
        'Contract not found or does not belong to this driver',
      );
    }

    return this.mapContract(c);
  }

  /**
   * Fetches contract documents by merging storage files and DB metadata records.
   * Deduplicates by file_path, preferring DB records (richer metadata).
   * Restricts to contracts that belong to the authenticated driver.
   */
  async getContractDocuments(
    driverId: string,
    contractId: string,
  ): Promise<ContractDocumentListResponse> {
    // Verify the contract belongs to this driver and get company context
    const contract = await this.prisma.contracts.findFirst({
      where: { id: contractId, driver_id: driverId },
      select: { id: true, owner_company_id: true },
    });

    if (!contract) {
      throw new NotFoundException(
        'Contract not found or does not belong to this driver',
      );
    }

    // Fetch from both sources in parallel
    const [storageResult, dbRecords] = await Promise.all([
      this.storage.list(
        contract.owner_company_id,
        `contracts/${contractId}/docs`,
      ),
      this.prisma.contract_documents.findMany({
        where: { parent_id: contractId, owner_company_id: contract.owner_company_id },
      }),
    ]);

    const storageFiles = storageResult.data || [];
    const dbRecordMap = new Map<string, (typeof dbRecords)[0]>();

    // Build a map of file_path -> DB record for deduplication
    for (const record of dbRecords) {
      if (record.file_path) {
        dbRecordMap.set(record.file_path, record);
      }
    }

    // Merge: prefer DB records, fall back to storage-only files
    const seenPaths = new Set<string>();
    const merged: ContractDocumentDto[] = [];

    // 1. First, add all DB records (richer metadata, preferred)
    for (const record of dbRecords) {
      merged.push({
        id: record.id,
        name: record.file_name,
        path: record.file_path,
        size: record.file_size ? Number(record.file_size) : undefined,
        contentType: record.file_extension ?? undefined,
        lastModified: record.created_at?.toISOString() ?? undefined,
        documentType: record.document_type ?? 'Other',
        expiryDate: record.expiry_date
          ? record.expiry_date.toISOString()
          : undefined,
        createdAt: record.created_at?.toISOString() ?? undefined,
      });
      if (record.file_path) {
        seenPaths.add(record.file_path);
      }
    }

    // 2. Add storage-only files that don't have a DB record
    for (const file of storageFiles) {
      if (!seenPaths.has(file.path)) {
        merged.push({
          id: file.path,
          name: file.name,
          path: file.path,
          size: file.size,
          lastModified: file.lastModified,
        });
      }
    }

    return { data: merged, error: null };
  }

  /**
   * Generates a signed URL for a contract document.
   * Supports both:
   * - UUID (from contract_documents DB record)
   * - Storage path (direct file path in S3)
   * Restricts to contracts that belong to the authenticated driver.
   */
  async generateDocumentUrl(
    driverId: string,
    contractId: string,
    fileId: string,
    download?: boolean,
  ): Promise<ContractDocumentUrlResponse> {
    // Verify the contract belongs to this driver
    const contract = await this.prisma.contracts.findFirst({
      where: { id: contractId, driver_id: driverId },
      select: { id: true, owner_company_id: true },
    });

    if (!contract) {
      throw new NotFoundException(
        'Contract not found or does not belong to this driver',
      );
    }

    // Try to resolve fileId as a UUID DB record first
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        fileId,
      );

    if (isUuid) {
      const dbRecord = await this.prisma.contract_documents.findFirst({
        where: {
          id: fileId,
          parent_id: contractId,
          owner_company_id: contract.owner_company_id,
        },
      });
      if (dbRecord && dbRecord.file_path) {
        const signed = await this.storage.getSignedUrl(
          contract.owner_company_id,
          dbRecord.file_path,
          { expiresIn: 3600 },
        );
        if (signed.error) {
          throw new ForbiddenException(signed.error);
        }
        return { url: signed.data! };
      }
    }

    // Fall back to treating fileId as a storage path
    const objectPath = fileId.startsWith('contracts/')
      ? fileId
      : `contracts/${contractId}/docs/${fileId}`;

    const signed = await this.storage.getSignedUrl(
      contract.owner_company_id,
      objectPath,
      { expiresIn: 3600 },
    );

    if (signed.error) {
      throw new ForbiddenException(signed.error);
    }

    return { url: signed.data! };
  }

  private mapContract(c: any): ContractDto {
    return {
      id: c.id,
      name: c.name,
      type: c.type,
      start_date: c.start_date,
      end_date: c.end_date ?? null,
      length_in_weeks: Number(c.length_in_weeks),
      allowed_kms_per_week: c.allowed_kms_per_week
        ? Number(c.allowed_kms_per_week)
        : null,
      preferred_payment_day: c.preferred_payment_day ?? null,
      is_manual_payment: c.is_manual_payment,
      intended_use: c.intended_use ?? null,
      fuel_level: c.fuel_level ?? null,
      deposit_received: c.deposit_received ?? null,
      cars: c.cars
        ? {
            id: c.cars.id,
            make: c.cars.make ?? null,
            model: c.cars.model ?? null,
            year: c.cars.year ? Number(c.cars.year) : null,
            registration: c.cars.registration ?? null,
            color: c.cars.color ?? null,
          }
        : null,
      car_prices: c.car_prices
        ? {
            id: c.car_prices.id,
            name: c.car_prices.name ?? null,
            unit_amount: Number(c.car_prices.unit_amount),
            interval: c.car_prices.interval,
            interval_count: c.car_prices.interval_count,
          }
        : null,
      contract_return_info: c.contract_return_info
        ? {
            return_date: c.contract_return_info.return_date ?? null,
            notice_date: c.contract_return_info.notice_date ?? null,
          }
        : null,
    };
  }
}