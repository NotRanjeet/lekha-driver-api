import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { DriverPortalService } from './driver-portal.service';
import { PrismaService } from '../common/database/prisma.service';

const mockPrisma = {
  drivers: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  contracts: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
  },
  invoice: {
    findMany: jest.fn(),
  },
  invoice_payments: {
    findMany: jest.fn(),
  },
};

describe('DriverPortalService', () => {
  let service: DriverPortalService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DriverPortalService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<DriverPortalService>(DriverPortalService);
  });

  // ─── acceptInvite ──────────────────────────────────────────────────────────

  describe('acceptInvite', () => {
    const userId = 'user-uuid';
    const token = 'invite-token-uuid';

    it('links driver to user and returns driver_id', async () => {
      const driver = {
        id: 'driver-id',
        auth_user_id: null,
        invite_token_expires_at: new Date(Date.now() + 86400_000),
      };
      mockPrisma.drivers.findFirst.mockResolvedValueOnce(driver); // find by token
      mockPrisma.drivers.findFirst.mockResolvedValueOnce(null); // check existing
      mockPrisma.drivers.update.mockResolvedValueOnce({ id: driver.id });

      const result = await service.acceptInvite(userId, token);

      expect(result).toEqual({ driver_id: 'driver-id' });
      expect(mockPrisma.drivers.update).toHaveBeenCalledWith({
        where: { id: driver.id },
        data: {
          auth_user_id: userId,
          invite_token: null,
          invite_token_expires_at: null,
        },
      });
    });

    it('throws NotFoundException when token not found', async () => {
      mockPrisma.drivers.findFirst.mockResolvedValueOnce(null);
      await expect(service.acceptInvite(userId, token)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws ConflictException when driver already linked', async () => {
      mockPrisma.drivers.findFirst.mockResolvedValueOnce({
        id: 'driver-id',
        auth_user_id: 'some-other-user',
        invite_token_expires_at: new Date(Date.now() + 86400_000),
      });
      await expect(service.acceptInvite(userId, token)).rejects.toThrow(
        ConflictException,
      );
    });

    it('throws BadRequestException when token is expired', async () => {
      mockPrisma.drivers.findFirst.mockResolvedValueOnce({
        id: 'driver-id',
        auth_user_id: null,
        invite_token_expires_at: new Date(Date.now() - 1000),
      });
      await expect(service.acceptInvite(userId, token)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws ConflictException when caller already linked to another driver', async () => {
      mockPrisma.drivers.findFirst.mockResolvedValueOnce({
        id: 'driver-id',
        auth_user_id: null,
        invite_token_expires_at: new Date(Date.now() + 86400_000),
      });
      mockPrisma.drivers.findFirst.mockResolvedValueOnce({
        id: 'other-driver-id',
      });
      await expect(service.acceptInvite(userId, token)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  // ─── getProfile ────────────────────────────────────────────────────────────

  describe('getProfile', () => {
    it('returns driver profile', async () => {
      const driver = {
        id: 'driver-id',
        first_name: 'Jane',
        last_name: 'Smith',
        email: 'jane@example.com',
        mobile: null,
        dob: null,
        license_number: null,
        license_expiry: null,
        license_state: null,
        license_country: null,
        address_line_one: null,
        address_line_two: null,
        address_suburb: null,
        address_state: null,
        address_post_code: null,
        address_country: null,
        emergency_name: null,
        emergency_phone: null,
        emergency_relation: null,
        business_name: null,
        business_abn: null,
        card_last_four: null,
        card_expiry_month: null,
        card_expiry_year: null,
        created_at: new Date('2024-01-01'),
      };
      mockPrisma.drivers.findUnique.mockResolvedValue(driver);

      const result = await service.getProfile('driver-id');
      expect(result.id).toBe('driver-id');
      expect(result.first_name).toBe('Jane');
      expect(result.last_name).toBe('Smith');
    });

    it('throws NotFoundException when driver not found', async () => {
      mockPrisma.drivers.findUnique.mockResolvedValue(null);
      await expect(service.getProfile('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ─── getSummary ────────────────────────────────────────────────────────────

  describe('getSummary', () => {
    it('computes totals and returns active_contract as null when none open', async () => {
      mockPrisma.invoice.findMany.mockResolvedValue([
        { amount: 350, balance: 0, invoice_payments: [{ amount: 350 }] },
        { amount: 700, balance: 350, invoice_payments: [{ amount: 350 }] },
      ]);
      mockPrisma.contracts.findFirst.mockResolvedValue(null);

      const result = await service.getSummary('driver-id');
      expect(result.total_invoiced).toBe(1050);
      expect(result.total_paid).toBe(700);
      expect(result.total_outstanding).toBe(350);
      expect(result.active_contract).toBeNull();
    });
  });
});
