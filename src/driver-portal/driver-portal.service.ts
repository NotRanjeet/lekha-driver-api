import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../common/database/prisma.service';
import { AcceptInviteResponseDto } from './dto/accept-invite.dto';
import {
  DriverProfileResponse,
  DriverContractSummary,
  DriverInvoiceSummary,
  DriverPaymentSummary,
  DriverBalanceSummary,
  ActiveContractInfo,
} from './dto/driver-portal-response.dto';

@Injectable()
export class DriverPortalService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Accept Invite ─────────────────────────────────────────────────────────

  async acceptInvite(
    userId: string,
    token: string,
  ): Promise<AcceptInviteResponseDto> {
    const driver = await this.prisma.drivers.findFirst({
      where: { invite_token: token },
    });

    if (!driver) {
      throw new NotFoundException('Invite token not found or already used');
    }

    if (driver.auth_user_id !== null) {
      throw new ConflictException(
        'This driver account is already linked to a user',
      );
    }

    if (
      driver.invite_token_expires_at &&
      driver.invite_token_expires_at < new Date()
    ) {
      throw new BadRequestException('Invite token has expired');
    }

    // Ensure caller is not already linked to another driver
    const existing = await this.prisma.drivers.findFirst({
      where: { auth_user_id: userId },
    });
    if (existing) {
      throw new ConflictException(
        'Your user account is already linked to another driver',
      );
    }

    await this.prisma.drivers.update({
      where: { id: driver.id },
      data: {
        auth_user_id: userId,
        invite_token: null,
        invite_token_expires_at: null,
      },
    });

    return { driver_id: driver.id };
  }

  // ─── Profile ───────────────────────────────────────────────────────────────

  async getProfile(driverId: string): Promise<DriverProfileResponse> {
    const driver = await this.prisma.drivers.findUnique({
      where: { id: driverId },
    });

    if (!driver) {
      throw new NotFoundException('Driver not found');
    }

    return {
      id: driver.id,
      first_name: driver.first_name,
      last_name: driver.last_name,
      email: driver.email ?? null,
      mobile: driver.mobile ?? null,
      dob: driver.dob ?? null,
      license_number: driver.license_number ?? null,
      license_expiry: driver.license_expiry ?? null,
      license_state: driver.license_state ?? null,
      license_country: driver.license_country ?? null,
      address_line_one: driver.address_line_one ?? null,
      address_line_two: driver.address_line_two ?? null,
      address_suburb: driver.address_suburb ?? null,
      address_state: driver.address_state ?? null,
      address_post_code: driver.address_post_code ?? null,
      address_country: driver.address_country ?? null,
      emergency_name: driver.emergency_name ?? null,
      emergency_phone: driver.emergency_phone ?? null,
      emergency_relation: driver.emergency_relation ?? null,
      business_name: driver.business_name ?? null,
      business_abn: driver.business_abn ?? null,
      card_last_four: driver.card_last_four ?? null,
      card_expiry_month: driver.card_expiry_month ?? null,
      card_expiry_year: driver.card_expiry_year ?? null,
      created_at: driver.created_at,
    };
  }

  // ─── Contracts ─────────────────────────────────────────────────────────────

  async getContracts(driverId: string): Promise<DriverContractSummary[]> {
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

    return contracts.map((c) => ({
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
    }));
  }

  async getContract(
    driverId: string,
    contractId: string,
  ): Promise<DriverContractSummary> {
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

  // ─── Invoices ──────────────────────────────────────────────────────────────

  async getInvoices(driverId: string): Promise<DriverInvoiceSummary[]> {
    const invoices = await this.prisma.invoice.findMany({
      where: { driver_id: driverId },
      orderBy: { created_at: 'desc' },
      include: {
        invoice_item: {
          select: {
            id: true,
            description: true,
            unit_amount: true,
            quantity: true,
            gst_percentage: true,
          },
        },
        invoice_payments: {
          where: { is_reversed: false },
          select: {
            id: true,
            amount: true,
            payment_date: true,
            payment_method: true,
            reference_number: true,
          },
        },
      },
    });

    return invoices.map((inv) => ({
      id: inv.id,
      invoice_name: inv.invoice_name ?? null,
      invoice_status: inv.invoice_status,
      amount: inv.amount,
      balance: inv.balance,
      period_start: inv.period_start ?? null,
      period_end: inv.period_end ?? null,
      due_date: inv.due_date ?? null,
      expected_payment_date: inv.expected_payment_date ?? null,
      created_at: inv.created_at,
      currency: inv.currency ?? null,
      invoice_item: inv.invoice_item.map((item) => ({
        id: Number(item.id),
        description: item.description ?? null,
        unit_amount: item.unit_amount,
        quantity: item.quantity,
        gst_percentage: item.gst_percentage ?? null,
      })),
      invoice_payments: inv.invoice_payments.map((pmt) => ({
        id: pmt.id,
        amount: pmt.amount,
        payment_date: pmt.payment_date,
        payment_method: pmt.payment_method ?? null,
        reference_number: pmt.reference_number ?? null,
      })),
    }));
  }

  // ─── Payments ──────────────────────────────────────────────────────────────

  async getPayments(driverId: string): Promise<DriverPaymentSummary[]> {
    const payments = await this.prisma.invoice_payments.findMany({
      where: {
        is_reversed: false,
        invoice: { driver_id: driverId },
      },
      orderBy: { payment_date: 'desc' },
      include: {
        invoice: {
          select: { id: true, invoice_name: true, invoice_status: true },
        },
      },
    });

    return payments.map((pmt) => ({
      id: pmt.id,
      amount: pmt.amount,
      payment_date: pmt.payment_date,
      payment_method: pmt.payment_method ?? null,
      reference_number: pmt.reference_number ?? null,
      notes: pmt.notes ?? null,
      invoice: {
        id: pmt.invoice.id,
        invoice_name: pmt.invoice.invoice_name ?? null,
        invoice_status: pmt.invoice.invoice_status,
      },
    }));
  }

  // ─── Summary ───────────────────────────────────────────────────────────────

  async getSummary(driverId: string): Promise<DriverBalanceSummary> {
    const invoices = await this.prisma.invoice.findMany({
      where: { driver_id: driverId },
      select: {
        amount: true,
        balance: true,
        invoice_payments: {
          where: { is_reversed: false },
          select: { amount: true },
        },
      },
    });

    const total_invoiced = invoices.reduce((sum, inv) => sum + inv.amount, 0);
    const total_paid = invoices.reduce(
      (sum, inv) =>
        sum + inv.invoice_payments.reduce((s, p) => s + p.amount, 0),
      0,
    );
    const total_outstanding = invoices.reduce(
      (sum, inv) => sum + inv.balance,
      0,
    );

    // Find active contract (no end_date = still open)
    const activeContract = await this.prisma.contracts.findFirst({
      where: { driver_id: driverId, end_date: null },
      orderBy: { start_date: 'desc' },
      include: {
        car_prices: {
          select: { unit_amount: true, interval: true, interval_count: true },
        },
      },
    });

    let active_contract: ActiveContractInfo | null = null;
    if (activeContract) {
      active_contract = {
        id: activeContract.id,
        name: activeContract.name,
        start_date: activeContract.start_date,
        preferred_payment_day: activeContract.preferred_payment_day ?? null,
        payment_amount: activeContract.car_prices
          ? Number(activeContract.car_prices.unit_amount)
          : null,
        payment_interval: activeContract.car_prices
          ? activeContract.car_prices.interval
          : null,
        payment_interval_count: activeContract.car_prices
          ? activeContract.car_prices.interval_count
          : null,
      };
    }

    return {
      total_invoiced,
      total_paid,
      total_outstanding,
      active_contract,
    };
  }
}
