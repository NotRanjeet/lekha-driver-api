import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EarningsQueryDto } from './dto/earnings.dto';
import {
  EarningsSummaryDto,
  EarningsListResponseDto,
  PayoutListResponseDto,
} from './dto/earnings-response.dto';

@Injectable()
export class EarningsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(
    driverId: string,
    query: EarningsQueryDto,
  ): Promise<EarningsSummaryDto> {
    const where: any = { driverId };
    if (query.from || query.to) {
      where.createdAt = {};
      if (query.from) where.createdAt.gte = new Date(query.from);
      if (query.to) where.createdAt.lte = new Date(query.to);
    }

    const earnings = await this.prisma.earning.findMany({ where });

    const totalGross = earnings.reduce((sum, e) => sum + e.grossAmount, 0);
    const totalPlatformFee = earnings.reduce(
      (sum, e) => sum + e.platformFee,
      0,
    );
    const totalNet = earnings.reduce((sum, e) => sum + e.netAmount, 0);
    const pendingPayment = earnings
      .filter((e) => !e.isPaid)
      .reduce((sum, e) => sum + e.netAmount, 0);

    return {
      totalGross: parseFloat(totalGross.toFixed(2)),
      totalPlatformFee: parseFloat(totalPlatformFee.toFixed(2)),
      totalNet: parseFloat(totalNet.toFixed(2)),
      pendingPayment: parseFloat(pendingPayment.toFixed(2)),
      tripCount: earnings.length,
      currency: 'AUD',
    };
  }

  async getEarningsHistory(
    driverId: string,
    query: EarningsQueryDto,
  ): Promise<EarningsListResponseDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: any = { driverId };
    if (query.from || query.to) {
      where.createdAt = {};
      if (query.from) where.createdAt.gte = new Date(query.from);
      if (query.to) where.createdAt.lte = new Date(query.to);
    }

    const [items, total] = await Promise.all([
      this.prisma.earning.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.earning.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getPayouts(
    driverId: string,
    query: EarningsQueryDto,
  ): Promise<PayoutListResponseDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: any = { driverId };
    if (query.from || query.to) {
      where.createdAt = {};
      if (query.from) where.createdAt.gte = new Date(query.from);
      if (query.to) where.createdAt.lte = new Date(query.to);
    }

    const [items, total] = await Promise.all([
      this.prisma.payout.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.payout.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
