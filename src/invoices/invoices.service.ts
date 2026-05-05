import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/database/prisma.service';
import { InvoiceDto, InvoicesSummaryDto } from './dto/invoice.dto';

@Injectable()
export class InvoicesService {
  constructor(private readonly prisma: PrismaService) {}

  async getInvoices(driverId: string): Promise<InvoiceDto[]> {
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

  async getInvoice(driverId: string, invoiceId: string): Promise<InvoiceDto> {
    const inv = await this.prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        OR: [
          { driver_id: driverId },
          { subscription: { driver_id: driverId } },
        ],
      },
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

    if (!inv) {
      throw new NotFoundException(
        'Invoice not found or does not belong to this driver',
      );
    }

    return {
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
    };
  }

  async getSummary(driverId: string): Promise<InvoicesSummaryDto> {
    const invoices = await this.prisma.invoice.findMany({
      where: { driver_id: driverId },
      orderBy: { created_at: 'desc' },
      select: {
        amount: true,
        balance: true,
        invoice_status: true,
        created_at: true,
      },
    });

    const total_invoiced = invoices.reduce((sum, inv) => sum + inv.amount, 0);

    // Pending balance: sum of balance for invoices that are not paid or void
    const pending_balance = invoices
      .filter(
        (inv) => inv.invoice_status !== 'paid' && inv.invoice_status !== 'void',
      )
      .reduce((sum, inv) => sum + inv.balance, 0);

    const last_invoice = invoices[0] ?? null;

    return {
      total_invoiced,
      pending_balance,
      last_invoice_date: last_invoice ? last_invoice.created_at : null,
      last_invoice_amount: last_invoice ? last_invoice.amount : null,
    };
  }
}
