import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

const mockPrismaService = {
  driver: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    findUniqueOrThrow: jest.fn(),
  },
};

const mockJwtService = {
  signAsync: jest.fn(),
};

const mockConfigService = {
  get: jest.fn().mockImplementation((key: string) => {
    const config: Record<string, string> = {
      JWT_SECRET: 'test-secret',
      JWT_REFRESH_SECRET: 'test-refresh-secret',
      JWT_EXPIRES_IN: '15m',
      JWT_REFRESH_EXPIRES_IN: '7d',
    };
    return config[key];
  }),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should throw ConflictException if email/phone already exists', async () => {
      mockPrismaService.driver.findFirst.mockResolvedValue({ id: 'existing' });

      await expect(
        service.register({
          email: 'test@example.com',
          phone: '+61412345678',
          password: 'password123',
          firstName: 'Test',
          lastName: 'Driver',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should create a driver and return tokens', async () => {
      mockPrismaService.driver.findFirst.mockResolvedValue(null);
      mockPrismaService.driver.create.mockResolvedValue({
        id: 'driver-1',
        email: 'test@example.com',
        phone: '+61412345678',
        firstName: 'Test',
        lastName: 'Driver',
        status: 'PENDING',
        passwordHash: 'hashed',
        refreshToken: null,
      });
      mockPrismaService.driver.update.mockResolvedValue({});
      mockJwtService.signAsync
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token');

      const result = await service.register({
        email: 'test@example.com',
        phone: '+61412345678',
        password: 'password123',
        firstName: 'Test',
        lastName: 'Driver',
      });

      expect(result.tokens.accessToken).toBe('access-token');
      expect(result.tokens.refreshToken).toBe('refresh-token');
      expect(result.driver.email).toBe('test@example.com');
    });
  });

  describe('login', () => {
    it('should throw UnauthorizedException if driver not found', async () => {
      mockPrismaService.driver.findUnique.mockResolvedValue(null);

      await expect(
        service.login({
          email: 'notfound@example.com',
          password: 'pass123456',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password does not match', async () => {
      const passwordHash = await bcrypt.hash('correct-password', 12);
      mockPrismaService.driver.findUnique.mockResolvedValue({
        id: 'driver-1',
        email: 'test@example.com',
        passwordHash,
      });

      await expect(
        service.login({
          email: 'test@example.com',
          password: 'wrong-password',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should return tokens on successful login', async () => {
      const passwordHash = await bcrypt.hash('password123', 12);
      mockPrismaService.driver.findUnique.mockResolvedValue({
        id: 'driver-1',
        email: 'test@example.com',
        phone: '+61412345678',
        firstName: 'Test',
        lastName: 'Driver',
        status: 'PENDING',
        passwordHash,
      });
      mockPrismaService.driver.update.mockResolvedValue({});
      mockJwtService.signAsync
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token');

      const result = await service.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result.tokens.accessToken).toBe('access-token');
      expect(result.driver.email).toBe('test@example.com');
    });
  });

  describe('logout', () => {
    it('should clear the refresh token', async () => {
      mockPrismaService.driver.update.mockResolvedValue({});

      await service.logout('driver-1');

      expect(mockPrismaService.driver.update).toHaveBeenCalledWith({
        where: { id: 'driver-1' },
        data: { refreshToken: null },
      });
    });
  });
});
