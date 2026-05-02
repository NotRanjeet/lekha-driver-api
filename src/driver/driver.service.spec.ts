import { Test, TestingModule } from '@nestjs/testing';
import { DriverService } from './driver.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { DriverStatus, AvailabilityStatus } from '@prisma/client';

const mockDriver = {
  id: 'driver-1',
  email: 'driver@example.com',
  phone: '+61412345678',
  firstName: 'John',
  lastName: 'Smith',
  profilePhotoUrl: null,
  dateOfBirth: null,
  status: DriverStatus.PENDING,
  availabilityStatus: AvailabilityStatus.OFFLINE,
  currentLatitude: null,
  currentLongitude: null,
  rating: 0,
  totalTrips: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
  vehicle: null,
};

const mockPrismaService = {
  driver: {
    findUniqueOrThrow: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
  },
  vehicle: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
};

describe('DriverService', () => {
  let service: DriverService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DriverService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<DriverService>(DriverService);
    jest.clearAllMocks();
  });

  describe('getProfile', () => {
    it('should return driver profile without sensitive fields', async () => {
      mockPrismaService.driver.findUniqueOrThrow.mockResolvedValue({
        ...mockDriver,
        passwordHash: 'hashed-password',
        refreshToken: 'refresh-token',
      });

      const result = await service.getProfile('driver-1');

      expect(result.id).toBe('driver-1');
      expect(result.email).toBe('driver@example.com');
      expect((result as any).passwordHash).toBeUndefined();
      expect((result as any).refreshToken).toBeUndefined();
    });
  });

  describe('updateAvailability', () => {
    it('should update and return availability status', async () => {
      const updatedAt = new Date();
      mockPrismaService.driver.update.mockResolvedValue({
        availabilityStatus: AvailabilityStatus.ONLINE,
        updatedAt,
      });

      const result = await service.updateAvailability('driver-1', {
        status: AvailabilityStatus.ONLINE,
      });

      expect(result.availabilityStatus).toBe(AvailabilityStatus.ONLINE);
    });
  });

  describe('createVehicle', () => {
    it('should throw ConflictException if license plate already exists', async () => {
      mockPrismaService.vehicle.findFirst.mockResolvedValue({ id: 'v-1' });

      await expect(
        service.createVehicle('driver-1', {
          make: 'Toyota',
          model: 'Camry',
          year: 2022,
          color: 'White',
          licensePlate: 'ABC123',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException if driver already has a vehicle', async () => {
      mockPrismaService.vehicle.findFirst.mockResolvedValue(null);
      mockPrismaService.vehicle.findUnique.mockResolvedValue({
        id: 'v-existing',
      });

      await expect(
        service.createVehicle('driver-1', {
          make: 'Toyota',
          model: 'Camry',
          year: 2022,
          color: 'White',
          licensePlate: 'XYZ789',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should create vehicle successfully', async () => {
      mockPrismaService.vehicle.findFirst.mockResolvedValue(null);
      mockPrismaService.vehicle.findUnique.mockResolvedValue(null);
      const createdVehicle = {
        id: 'v-1',
        driverId: 'driver-1',
        make: 'Toyota',
        model: 'Camry',
        year: 2022,
        color: 'White',
        licensePlate: 'ABC123',
        capacity: 4,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockPrismaService.vehicle.create.mockResolvedValue(createdVehicle);

      const result = await service.createVehicle('driver-1', {
        make: 'Toyota',
        model: 'Camry',
        year: 2022,
        color: 'White',
        licensePlate: 'ABC123',
      });

      expect(result.make).toBe('Toyota');
      expect(result.licensePlate).toBe('ABC123');
    });
  });

  describe('getVehicle', () => {
    it('should throw NotFoundException if vehicle does not exist', async () => {
      mockPrismaService.vehicle.findUnique.mockResolvedValue(null);

      await expect(service.getVehicle('driver-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
