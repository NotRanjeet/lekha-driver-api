import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  UpdateDriverProfileDto,
  UpdateAvailabilityDto,
  UpdateLocationDto,
  CreateVehicleDto,
  UpdateVehicleDto,
} from './dto/driver.dto';
import {
  DriverProfileResponseDto,
  VehicleResponseDto,
  AvailabilityResponseDto,
} from './dto/driver-response.dto';

@Injectable()
export class DriverService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Profile ──────────────────────────────────────────────────────────────

  async getProfile(driverId: string): Promise<DriverProfileResponseDto> {
    const driver = await this.prisma.driver.findUniqueOrThrow({
      where: { id: driverId },
      include: { vehicle: true },
    });

    return this.mapDriverToProfile(driver);
  }

  async updateProfile(
    driverId: string,
    dto: UpdateDriverProfileDto,
  ): Promise<DriverProfileResponseDto> {
    if (dto.email) {
      const existing = await this.prisma.driver.findFirst({
        where: { email: dto.email, NOT: { id: driverId } },
      });
      if (existing) throw new ConflictException('Email already in use');
    }

    if (dto.phone) {
      const existing = await this.prisma.driver.findFirst({
        where: { phone: dto.phone, NOT: { id: driverId } },
      });
      if (existing) throw new ConflictException('Phone already in use');
    }

    const driver = await this.prisma.driver.update({
      where: { id: driverId },
      data: {
        ...dto,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
      },
      include: { vehicle: true },
    });

    return this.mapDriverToProfile(driver);
  }

  // ─── Availability ─────────────────────────────────────────────────────────

  async updateAvailability(
    driverId: string,
    dto: UpdateAvailabilityDto,
  ): Promise<AvailabilityResponseDto> {
    const driver = await this.prisma.driver.update({
      where: { id: driverId },
      data: { availabilityStatus: dto.status },
    });

    return {
      availabilityStatus: driver.availabilityStatus,
      updatedAt: driver.updatedAt,
    };
  }

  // ─── Location ─────────────────────────────────────────────────────────────

  async updateLocation(
    driverId: string,
    dto: UpdateLocationDto,
  ): Promise<void> {
    await this.prisma.driver.update({
      where: { id: driverId },
      data: {
        currentLatitude: dto.latitude,
        currentLongitude: dto.longitude,
      },
    });
  }

  // ─── Vehicle ──────────────────────────────────────────────────────────────

  async createVehicle(
    driverId: string,
    dto: CreateVehicleDto,
  ): Promise<VehicleResponseDto> {
    const existing = await this.prisma.vehicle.findFirst({
      where: { licensePlate: dto.licensePlate },
    });
    if (existing) {
      throw new ConflictException('License plate already registered');
    }

    const existingVehicle = await this.prisma.vehicle.findUnique({
      where: { driverId },
    });
    if (existingVehicle) {
      throw new ConflictException(
        'Driver already has a vehicle. Use PATCH to update it.',
      );
    }

    const vehicle = await this.prisma.vehicle.create({
      data: {
        driverId,
        make: dto.make,
        model: dto.model,
        year: dto.year,
        color: dto.color,
        licensePlate: dto.licensePlate,
        capacity: dto.capacity ?? 4,
      },
    });

    return vehicle;
  }

  async updateVehicle(
    driverId: string,
    dto: UpdateVehicleDto,
  ): Promise<VehicleResponseDto> {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { driverId },
    });
    if (!vehicle) {
      throw new NotFoundException(
        'Vehicle not found. Please register a vehicle first.',
      );
    }

    if (dto.licensePlate) {
      const existing = await this.prisma.vehicle.findFirst({
        where: { licensePlate: dto.licensePlate, NOT: { driverId } },
      });
      if (existing) throw new ConflictException('License plate already in use');
    }

    const updated = await this.prisma.vehicle.update({
      where: { driverId },
      data: dto,
    });

    return updated;
  }

  async getVehicle(driverId: string): Promise<VehicleResponseDto> {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { driverId },
    });
    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }
    return vehicle;
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private mapDriverToProfile(driver: any): DriverProfileResponseDto {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, refreshToken, ...profile } = driver;
    return profile as DriverProfileResponseDto;
  }
}
