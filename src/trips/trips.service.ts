import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TripStatus, AvailabilityStatus } from '@prisma/client';
import {
  AcceptTripDto,
  CancelTripDto,
  RateTripDto,
  TripQueryDto,
} from './dto/trip.dto';
import { TripResponseDto, TripListResponseDto } from './dto/trip-response.dto';

@Injectable()
export class TripsService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Get current active trip ──────────────────────────────────────────────

  async getActiveTrip(driverId: string): Promise<TripResponseDto | null> {
    const trip = await this.prisma.trip.findFirst({
      where: {
        driverId,
        status: {
          in: [
            TripStatus.ACCEPTED,
            TripStatus.DRIVER_EN_ROUTE,
            TripStatus.ARRIVED,
            TripStatus.IN_PROGRESS,
          ],
        },
      },
      orderBy: { requestedAt: 'desc' },
    });

    return trip;
  }

  // ─── Get trip history ─────────────────────────────────────────────────────

  async getTripHistory(
    driverId: string,
    query: TripQueryDto,
  ): Promise<TripListResponseDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: any = { driverId };
    if (query.status) {
      where.status = query.status;
    } else {
      // Default: completed and cancelled trips for history
      where.status = {
        in: [TripStatus.COMPLETED, TripStatus.CANCELLED],
      };
    }

    const [items, total] = await Promise.all([
      this.prisma.trip.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.trip.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ─── Get trip by ID ───────────────────────────────────────────────────────

  async getTripById(
    driverId: string,
    tripId: string,
  ): Promise<TripResponseDto> {
    const trip = await this.prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip) {
      throw new NotFoundException('Trip not found');
    }
    if (trip.driverId !== driverId) {
      throw new ForbiddenException('You do not have access to this trip');
    }
    return trip;
  }

  // ─── Accept trip ──────────────────────────────────────────────────────────

  async acceptTrip(
    driverId: string,
    dto: AcceptTripDto,
  ): Promise<TripResponseDto> {
    const trip = await this.prisma.trip.findUnique({
      where: { id: dto.tripId },
    });

    if (!trip) {
      throw new NotFoundException('Trip not found');
    }

    if (trip.status !== TripStatus.REQUESTED) {
      throw new BadRequestException('Trip is no longer available');
    }

    // Check driver has no active trip
    const activeTrip = await this.getActiveTrip(driverId);
    if (activeTrip) {
      throw new BadRequestException('You already have an active trip');
    }

    const [updatedTrip] = await this.prisma.$transaction([
      this.prisma.trip.update({
        where: { id: dto.tripId },
        data: {
          driverId,
          status: TripStatus.ACCEPTED,
          acceptedAt: new Date(),
        },
      }),
      this.prisma.driver.update({
        where: { id: driverId },
        data: { availabilityStatus: AvailabilityStatus.ON_TRIP },
      }),
    ]);

    return updatedTrip;
  }

  // ─── Arrive at pickup ─────────────────────────────────────────────────────

  async arriveAtPickup(
    driverId: string,
    tripId: string,
  ): Promise<TripResponseDto> {
    const trip = await this.getDriverTrip(driverId, tripId);
    this.assertTripStatus(
      trip.status,
      TripStatus.ACCEPTED,
      'Trip must be in ACCEPTED state to mark arrival',
    );

    return this.prisma.trip.update({
      where: { id: tripId },
      data: {
        status: TripStatus.ARRIVED,
        driverArrivedAt: new Date(),
      },
    });
  }

  // ─── Start trip ───────────────────────────────────────────────────────────

  async startTrip(driverId: string, tripId: string): Promise<TripResponseDto> {
    const trip = await this.getDriverTrip(driverId, tripId);
    this.assertTripStatus(
      trip.status,
      TripStatus.ARRIVED,
      'Trip must be in ARRIVED state to start',
    );

    return this.prisma.trip.update({
      where: { id: tripId },
      data: {
        status: TripStatus.IN_PROGRESS,
        startedAt: new Date(),
      },
    });
  }

  // ─── Complete trip ────────────────────────────────────────────────────────

  async completeTrip(
    driverId: string,
    tripId: string,
  ): Promise<TripResponseDto> {
    const trip = await this.getDriverTrip(driverId, tripId);
    this.assertTripStatus(
      trip.status,
      TripStatus.IN_PROGRESS,
      'Trip must be IN_PROGRESS to complete',
    );

    const now = new Date();
    const durationMinutes = trip.startedAt
      ? Math.round((now.getTime() - trip.startedAt.getTime()) / 60000)
      : null;

    const [updatedTrip] = await this.prisma.$transaction([
      this.prisma.trip.update({
        where: { id: tripId },
        data: {
          status: TripStatus.COMPLETED,
          completedAt: now,
          actualDuration: durationMinutes,
        },
      }),
      this.prisma.driver.update({
        where: { id: driverId },
        data: {
          availabilityStatus: AvailabilityStatus.ONLINE,
          totalTrips: { increment: 1 },
        },
      }),
    ]);

    // Create earning record if fare is set
    if (trip.totalFare) {
      const platformFee = parseFloat((trip.totalFare * 0.2).toFixed(2));
      const netAmount = parseFloat((trip.totalFare - platformFee).toFixed(2));

      await this.prisma.earning.create({
        data: {
          driverId,
          tripId,
          grossAmount: trip.totalFare,
          platformFee,
          netAmount,
        },
      });
    }

    return updatedTrip;
  }

  // ─── Cancel trip ──────────────────────────────────────────────────────────

  async cancelTrip(
    driverId: string,
    tripId: string,
    dto: CancelTripDto,
  ): Promise<TripResponseDto> {
    const trip = await this.getDriverTrip(driverId, tripId);

    const cancellableStatuses: TripStatus[] = [
      TripStatus.ACCEPTED,
      TripStatus.DRIVER_EN_ROUTE,
      TripStatus.ARRIVED,
    ];

    if (!cancellableStatuses.includes(trip.status)) {
      throw new BadRequestException(
        `Cannot cancel a trip in ${trip.status} status`,
      );
    }

    const [updatedTrip] = await this.prisma.$transaction([
      this.prisma.trip.update({
        where: { id: tripId },
        data: {
          status: TripStatus.CANCELLED,
          cancellationReason: dto.reason,
          cancelledBy: 'driver',
          cancelledAt: new Date(),
          driverId: null,
        },
      }),
      this.prisma.driver.update({
        where: { id: driverId },
        data: { availabilityStatus: AvailabilityStatus.ONLINE },
      }),
    ]);

    return updatedTrip;
  }

  // ─── Rate passenger ───────────────────────────────────────────────────────

  async ratePassenger(
    driverId: string,
    tripId: string,
    dto: RateTripDto,
  ): Promise<TripResponseDto> {
    const trip = await this.getDriverTrip(driverId, tripId);

    if (trip.status !== TripStatus.COMPLETED) {
      throw new BadRequestException('Can only rate completed trips');
    }

    if (trip.passengerRating) {
      throw new BadRequestException('Passenger already rated for this trip');
    }

    return this.prisma.trip.update({
      where: { id: tripId },
      data: {
        passengerRating: dto.rating,
        driverNote: dto.note,
      },
    });
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private async getDriverTrip(driverId: string, tripId: string) {
    const trip = await this.prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip) throw new NotFoundException('Trip not found');
    if (trip.driverId !== driverId) {
      throw new ForbiddenException('You do not have access to this trip');
    }
    return trip;
  }

  private assertTripStatus(
    actual: TripStatus,
    expected: TripStatus,
    message: string,
  ): void {
    if (actual !== expected) {
      throw new BadRequestException(message);
    }
  }
}
