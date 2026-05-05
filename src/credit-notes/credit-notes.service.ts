import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/database/prisma.service';
import { CreditNoteDto, CreditNotesSummaryDto } from './dto/credit-note.dto';

@Injectable()
export class CreditNotesService {
  constructor(private readonly prisma: PrismaService) {}

  async getCreditNotes(driverId: string): Promise<CreditNoteDto[]> {
    const notes = await this.prisma.credit_notes.findMany({
      where: { driver_id: driverId },
      orderBy: { created_at: 'desc' },
      include: {
        credit_applications: {
          where: { is_reversed: false },
          select: {
            id: true,
            invoice_id: true,
            amount_applied: true,
            applied_at: true,
            is_reversed: true,
            notes: true,
          },
        },
      },
    });

    return notes.map((note) => this.mapCreditNote(note));
  }

  async getCreditNote(
    driverId: string,
    creditNoteId: string,
  ): Promise<CreditNoteDto> {
    const note = await this.prisma.credit_notes.findFirst({
      where: { id: creditNoteId, driver_id: driverId },
      include: {
        credit_applications: {
          where: { is_reversed: false },
          select: {
            id: true,
            invoice_id: true,
            amount_applied: true,
            applied_at: true,
            is_reversed: true,
            notes: true,
          },
        },
      },
    });

    if (!note) {
      throw new NotFoundException(
        'Credit note not found or does not belong to this driver',
      );
    }

    return this.mapCreditNote(note);
  }

  async getSummary(driverId: string): Promise<CreditNotesSummaryDto> {
    const notes = await this.prisma.credit_notes.findMany({
      where: { driver_id: driverId },
      orderBy: { created_at: 'desc' },
      select: { original_amount: true, created_at: true },
    });

    const credit_notes_count = notes.length;
    const total_amount = notes.reduce(
      (sum, note) => sum + note.original_amount,
      0,
    );
    const last_note = notes[0] ?? null;

    return {
      credit_notes_count,
      total_amount,
      last_credit_note_date: last_note ? last_note.created_at : null,
      last_credit_note_amount: last_note ? last_note.original_amount : null,
    };
  }

  private mapCreditNote(note: any): CreditNoteDto {
    const applied = note.credit_applications.reduce(
      (sum: number, app: any) => sum + app.amount_applied,
      0,
    );
    return {
      id: note.id,
      credit_note_number: note.credit_note_number,
      created_at: note.created_at,
      original_amount: note.original_amount,
      remaining_amount: note.original_amount - applied,
      currency: note.currency,
      reason: note.reason,
      description: note.description ?? null,
      reference_number: note.reference_number ?? null,
      status: note.status,
      expires_at: note.expires_at ?? null,
      credit_applications: note.credit_applications.map((app: any) => ({
        id: app.id,
        invoice_id: app.invoice_id,
        amount_applied: app.amount_applied,
        applied_at: app.applied_at,
        is_reversed: app.is_reversed,
        notes: app.notes ?? null,
      })),
    };
  }
}
