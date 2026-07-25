import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  readonly client: PrismaClient;

  constructor() {
    this.client = new PrismaClient();
  }

  // ─── Table accessors ────────────────────────────────────────────────────────

  get drivers() {
    return this.client.drivers;
  }

  get contracts() {
    return this.client.contracts;
  }

  get invoice() {
    return this.client.invoice;
  }

  get invoice_payments() {
    return this.client.invoice_payments;
  }

  get credit_notes() {
    return this.client.credit_notes;
  }

  get credit_applications() {
    return this.client.credit_applications;
  }

  get driver_requests() {
    return this.client.driver_requests;
  }

  get driver_request_categories() {
    return this.client.driver_request_categories;
  }

  get driver_request_comments() {
    return this.client.driver_request_comments;
  }

  get driver_request_status_history() {
    return this.client.driver_request_status_history;
  }

  get contract_documents() {
    return this.client.contract_documents;
  }

  async $transaction<T>(fn: (tx: PrismaClient) => Promise<T>): Promise<T> {
    return this.client.$transaction(fn);
  }

  async onModuleInit(): Promise<void> {
    await this.client.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.$disconnect();
  }
}
