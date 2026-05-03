import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { DriverRequestsService } from './driver-requests.service';
import { DriverRequestsRepository } from './driver-requests.repository';
import { driver_request_severity, driver_request_status } from '@prisma/client';

const mockRepo = {
  listCategories: jest.fn(),
  findCategoryById: jest.fn(),
  createRequest: jest.fn(),
  listRequests: jest.fn(),
  findRequestById: jest.fn(),
  findRequestStatus: jest.fn(),
  addComment: jest.fn(),
};

const category = {
  id: 'cat-id',
  name: 'Tyre Service',
  description: null,
  default_severity: driver_request_severity.medium,
  is_active: true,
  created_at: new Date(),
  updated_at: new Date(),
};

const request = {
  id: 'req-id',
  title: 'New tyres needed',
  status: driver_request_status.new,
  severity: driver_request_severity.medium,
  category_id: 'cat-id',
  category_name: 'Tyre Service',
  driver_id: 'driver-id',
  description: null,
  assigned_to: null,
  created_at: new Date(),
  updated_at: new Date(),
};

describe('DriverRequestsService', () => {
  let service: DriverRequestsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DriverRequestsService,
        { provide: DriverRequestsRepository, useValue: mockRepo },
      ],
    }).compile();

    service = module.get<DriverRequestsService>(DriverRequestsService);
  });

  // ─── listCategories ────────────────────────────────────────────────────────

  describe('listCategories', () => {
    it('returns active categories for the company', async () => {
      mockRepo.listCategories.mockResolvedValue([category]);
      const result = await service.listCategories('company-id');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Tyre Service');
    });
  });

  // ─── createRequest ─────────────────────────────────────────────────────────

  describe('createRequest', () => {
    const dto = {
      category_id: 'cat-id',
      title: 'New tyres needed',
      description: undefined,
    };

    it('creates and returns a new request', async () => {
      mockRepo.findCategoryById.mockResolvedValue(category);
      mockRepo.createRequest.mockResolvedValue(request);

      const result = await service.createRequest(
        'company-id',
        'driver-id',
        dto,
      );
      expect(result.title).toBe('New tyres needed');
      expect(mockRepo.createRequest).toHaveBeenCalledWith(
        'company-id',
        'driver-id',
        'cat-id',
        'New tyres needed',
        undefined,
        driver_request_severity.medium,
      );
    });

    it('throws NotFoundException when category not found', async () => {
      mockRepo.findCategoryById.mockResolvedValue(null);
      await expect(
        service.createRequest('company-id', 'driver-id', dto),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when category is inactive', async () => {
      mockRepo.findCategoryById.mockResolvedValue({
        ...category,
        is_active: false,
      });
      await expect(
        service.createRequest('company-id', 'driver-id', dto),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─── getRequestDetail ──────────────────────────────────────────────────────

  describe('getRequestDetail', () => {
    it('returns request detail', async () => {
      mockRepo.findRequestById.mockResolvedValue({
        ...request,
        resolved_at: null,
        resolved_by: null,
        resolve_comment: null,
        comments: [],
        status_history: [],
      });

      const result = await service.getRequestDetail(
        'company-id',
        'req-id',
        'driver-id',
      );
      expect(result.id).toBe('req-id');
      expect(result.comments).toHaveLength(0);
    });

    it('throws NotFoundException when request not found', async () => {
      mockRepo.findRequestById.mockResolvedValue(null);
      await expect(
        service.getRequestDetail('company-id', 'nonexistent', 'driver-id'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ─── addDriverComment ──────────────────────────────────────────────────────

  describe('addDriverComment', () => {
    it('adds a comment successfully', async () => {
      mockRepo.findRequestStatus.mockResolvedValue({ id: 'req-id' });
      mockRepo.addComment.mockResolvedValue({
        id: 'comment-id',
        request_id: 'req-id',
        comment: 'Please prioritise',
        is_staff_comment: false,
        author_driver_id: 'driver-id',
        author_user_id: null,
        created_at: new Date(),
      });

      const result = await service.addDriverComment(
        'company-id',
        'req-id',
        'driver-id',
        {
          comment: 'Please prioritise',
        },
      );

      expect(result.comment).toBe('Please prioritise');
      expect(result.is_staff_comment).toBe(false);
    });

    it('throws NotFoundException when request not found', async () => {
      mockRepo.findRequestStatus.mockResolvedValue(null);
      await expect(
        service.addDriverComment('company-id', 'nonexistent', 'driver-id', {
          comment: 'test',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
