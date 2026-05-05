import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/database/prisma.service';
import {
  DriverRequestCategoryResponseDto,
  DriverRequestSummaryDto,
  DriverRequestDetailDto,
  DriverRequestCommentDto,
} from './dto/request.dto';
import { driver_request_severity, driver_request_status } from '@prisma/client';

@Injectable()
export class RequestsRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Categories ────────────────────────────────────────────────────────────

  async listCategories(
    companyId: string,
  ): Promise<DriverRequestCategoryResponseDto[]> {
    const cats = await this.prisma.driver_request_categories.findMany({
      where: { owner_company_id: companyId, is_active: true },
      orderBy: { name: 'asc' },
    });

    return cats.map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description ?? null,
      default_severity: c.default_severity,
      is_active: c.is_active,
      created_at: c.created_at,
      updated_at: c.updated_at,
    }));
  }

  async findCategoryById(
    companyId: string,
    categoryId: string,
  ): Promise<DriverRequestCategoryResponseDto | null> {
    const c = await this.prisma.driver_request_categories.findFirst({
      where: { id: categoryId, owner_company_id: companyId },
    });

    if (!c) return null;

    return {
      id: c.id,
      name: c.name,
      description: c.description ?? null,
      default_severity: c.default_severity,
      is_active: c.is_active,
      created_at: c.created_at,
      updated_at: c.updated_at,
    };
  }

  // ─── Requests ──────────────────────────────────────────────────────────────

  async createRequest(
    companyId: string,
    driverId: string,
    categoryId: string,
    title: string,
    description: string | undefined,
    severity: driver_request_severity,
  ): Promise<DriverRequestSummaryDto> {
    const created = await this.prisma.driver_requests.create({
      data: {
        owner_company_id: companyId,
        driver_id: driverId,
        category_id: categoryId,
        title,
        description: description ?? null,
        severity,
        status: driver_request_status.new,
      },
      include: {
        driver_request_categories: { select: { name: true } },
      },
    });

    await this.prisma.driver_request_status_history.create({
      data: {
        request_id: created.id,
        from_status: null,
        to_status: driver_request_status.new,
        note: 'Request created',
      },
    });

    return {
      id: created.id,
      title: created.title,
      status: created.status,
      severity: created.severity,
      category_id: created.category_id,
      category_name: created.driver_request_categories.name,
      driver_id: created.driver_id,
      description: created.description ?? null,
      assigned_to: created.assigned_to ?? null,
      created_at: created.created_at,
      updated_at: created.updated_at,
    };
  }

  async listRequests(
    companyId: string,
    driverId: string,
  ): Promise<DriverRequestSummaryDto[]> {
    const requests = await this.prisma.driver_requests.findMany({
      where: { owner_company_id: companyId, driver_id: driverId },
      orderBy: { created_at: 'desc' },
      include: {
        driver_request_categories: { select: { name: true } },
      },
    });

    return requests.map((r) => ({
      id: r.id,
      title: r.title,
      status: r.status,
      severity: r.severity,
      category_id: r.category_id,
      category_name: r.driver_request_categories.name,
      driver_id: r.driver_id,
      description: r.description ?? null,
      assigned_to: r.assigned_to ?? null,
      created_at: r.created_at,
      updated_at: r.updated_at,
    }));
  }

  async findRequestById(
    companyId: string,
    requestId: string,
    driverId: string,
  ): Promise<DriverRequestDetailDto | null> {
    const r = await this.prisma.driver_requests.findFirst({
      where: {
        id: requestId,
        owner_company_id: companyId,
        driver_id: driverId,
      },
      include: {
        driver_request_categories: { select: { name: true } },
        driver_request_comments: {
          orderBy: { created_at: 'asc' },
        },
        driver_request_status_history: {
          orderBy: { created_at: 'asc' },
        },
      },
    });

    if (!r) return null;

    return {
      id: r.id,
      title: r.title,
      status: r.status,
      severity: r.severity,
      category_id: r.category_id,
      category_name: r.driver_request_categories.name,
      driver_id: r.driver_id,
      description: r.description ?? null,
      assigned_to: r.assigned_to ?? null,
      resolved_at: r.resolved_at ?? null,
      resolved_by: r.resolved_by ?? null,
      resolve_comment: r.resolve_comment ?? null,
      created_at: r.created_at,
      updated_at: r.updated_at,
      comments: r.driver_request_comments.map((c) => ({
        id: c.id,
        request_id: c.request_id,
        comment: c.comment,
        is_staff_comment: c.is_staff_comment,
        author_driver_id: c.author_driver_id ?? null,
        author_user_id: c.author_user_id ?? null,
        created_at: c.created_at,
      })),
      status_history: r.driver_request_status_history.map((h) => ({
        id: h.id,
        request_id: h.request_id,
        from_status: h.from_status ?? null,
        to_status: h.to_status,
        changed_by: h.changed_by ?? null,
        note: h.note ?? null,
        duration_ms: h.duration_ms != null ? String(h.duration_ms) : null,
        created_at: h.created_at,
      })),
    };
  }

  async findRequestStatus(
    companyId: string,
    requestId: string,
    driverId: string,
  ): Promise<{ id: string } | null> {
    return this.prisma.driver_requests.findFirst({
      where: {
        id: requestId,
        owner_company_id: companyId,
        driver_id: driverId,
      },
      select: { id: true },
    });
  }

  // ─── Comments ──────────────────────────────────────────────────────────────

  async addComment(
    requestId: string,
    comment: string,
    authorDriverId: string,
  ): Promise<DriverRequestCommentDto> {
    const created = await this.prisma.driver_request_comments.create({
      data: {
        request_id: requestId,
        comment,
        is_staff_comment: false,
        author_driver_id: authorDriverId,
      },
    });

    return {
      id: created.id,
      request_id: created.request_id,
      comment: created.comment,
      is_staff_comment: created.is_staff_comment,
      author_driver_id: created.author_driver_id ?? null,
      author_user_id: created.author_user_id ?? null,
      created_at: created.created_at,
    };
  }
}
