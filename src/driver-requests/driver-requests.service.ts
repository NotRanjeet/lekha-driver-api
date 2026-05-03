import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { DriverRequestsRepository } from './driver-requests.repository';
import {
  CreateDriverRequestDto,
  AddCommentDto,
} from './dto/driver-request.dto';
import type {
  DriverRequestSummaryDto,
  DriverRequestDetailDto,
  DriverRequestCommentDto,
  DriverRequestCategoryResponseDto,
} from './dto/driver-request.dto';

@Injectable()
export class DriverRequestsService {
  constructor(private readonly repo: DriverRequestsRepository) {}

  async listCategories(
    companyId: string,
  ): Promise<DriverRequestCategoryResponseDto[]> {
    return this.repo.listCategories(companyId);
  }

  async createRequest(
    companyId: string,
    driverId: string,
    dto: CreateDriverRequestDto,
  ): Promise<DriverRequestSummaryDto> {
    const category = await this.repo.findCategoryById(
      companyId,
      dto.category_id,
    );
    if (!category) {
      throw new NotFoundException(
        `Category ${dto.category_id} not found for this company`,
      );
    }
    if (!category.is_active) {
      throw new BadRequestException(
        'This request category is no longer active',
      );
    }
    return this.repo.createRequest(
      companyId,
      driverId,
      dto.category_id,
      dto.title,
      dto.description,
      category.default_severity,
    );
  }

  async listRequests(
    companyId: string,
    driverId: string,
  ): Promise<DriverRequestSummaryDto[]> {
    return this.repo.listRequests(companyId, driverId);
  }

  async getRequestDetail(
    companyId: string,
    requestId: string,
    driverId: string,
  ): Promise<DriverRequestDetailDto> {
    const request = await this.repo.findRequestById(
      companyId,
      requestId,
      driverId,
    );
    if (!request) {
      throw new NotFoundException('Driver request not found');
    }
    return request;
  }

  async addDriverComment(
    companyId: string,
    requestId: string,
    driverId: string,
    dto: AddCommentDto,
  ): Promise<DriverRequestCommentDto> {
    const exists = await this.repo.findRequestStatus(
      companyId,
      requestId,
      driverId,
    );
    if (!exists) {
      throw new NotFoundException('Driver request not found');
    }
    return this.repo.addComment(requestId, dto.comment, driverId);
  }
}
