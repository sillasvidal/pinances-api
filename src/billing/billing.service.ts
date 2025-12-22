import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BillingInvoice, BillingInvoiceStatus } from '../entities/billing-invoice.entity';
import { Subscription } from '../entities/subscription.entity';

@Injectable()
export class BillingService {
  constructor(
    @InjectRepository(BillingInvoice)
    private readonly invoiceRepository: Repository<BillingInvoice>,
  ) {}

  async findAllBySubscription(subscriptionId: string): Promise<BillingInvoice[]> {
    return await this.invoiceRepository.find({
      where: { subscription_id: subscriptionId },
      order: { created_at: 'DESC' },
    });
  }

  async findAllByUser(userId: string): Promise<BillingInvoice[]> {
    return await this.invoiceRepository.find({
      where: { subscription: { user_id: userId } },
      relations: ['subscription', 'subscription.plan'],
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: string): Promise<BillingInvoice> {
    const invoice = await this.invoiceRepository.findOne({
      where: { id },
      relations: ['subscription'],
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    return invoice;
  }

  // Method to be called by SubscriptionService or Cron Job
  async createInvoice(subscription: Subscription, amount: number, url?: string): Promise<BillingInvoice> {
    const invoice = this.invoiceRepository.create({
      subscription,
      amount,
      hosted_invoice_url: url,
      status: BillingInvoiceStatus.OPEN,
      currency: subscription.plan.currency,
    });
    return await this.invoiceRepository.save(invoice);
  }
}
