import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/database/prisma.service';
import { PaymentDto, PaymentsSummaryDto } from './dto/payment.dto';

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  async getPayments(driverId: string): Promise<PaymentDto[]> {
    const payments = await this.prisma.invoice_payments.findMany({
      where: {
        is_reversed: false,
        invoice: {
          OR: [
            { driver_id: driverId },
            { subscription: { driver_id: driverId } },
          ],
        },
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

  async getPayment(driverId: string, paymentId: string): Promise<PaymentDto> {
    const pmt = await this.prisma.invoice_payments.findFirst({
      where: {
        id: paymentId,
        is_reversed: false,
        invoice: {
          OR: [
            { driver_id: driverId },
            { subscription: { driver_id: driverId } },
          ],
        },
      },
      include: {
        invoice: {
          select: { id: true, invoice_name: true, invoice_status: true },
        },
      },
    });

    if (!pmt) {
      throw new NotFoundException(
        'Payment not found or does not belong to this driver',
      );
    }

    return {
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
    };
  }

  async getSummary(driverId: string): Promise<PaymentsSummaryDto> {
    const payments = await this.prisma.invoice_payments.findMany({
      where: {
        is_reversed: false,
        invoice: {
          OR: [
            { driver_id: driverId },
            { subscription: { driver_id: driverId } },
          ],
        },
      },
      orderBy: { payment_date: 'desc' },
      select: { amount: true, payment_date: true },
    });

    const last_payment = payments[0] ?? null;
    const total_payment_count = payments.length;
    const total_payment_sum = payments.reduce(
      (sum, pmt) => sum + pmt.amount,
      0,
    );

    return {
      last_payment_date: last_payment ? last_payment.payment_date : null,
      last_payment_amount: last_payment ? last_payment.amount : null,
      total_payment_count,
      total_payment_sum,
    };
  }
}
