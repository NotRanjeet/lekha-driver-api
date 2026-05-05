import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/database/prisma.service';
import { ContractDto } from './dto/contract.dto';

@Injectable()
export class ContractsService {
  constructor(private readonly prisma: PrismaService) {}

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
