import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from '../entities/payment.entity';
import { GatewayCustomer } from '../entities/gateway-customer.entity';

import {
  PAYMENT_GATEWAY,
} from './interfaces/payment-gateway.interface';
import type {
  PaymentGateway,
  CreateSubscriptionInput,
  PaymentGatewaySubscription,
} from './interfaces/payment-gateway.interface';
import { User } from '../entities/user.entity';


@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(GatewayCustomer)
    private readonly gatewayCustomerRepository: Repository<GatewayCustomer>,
    @Inject(PAYMENT_GATEWAY)
    private readonly paymentGateway: PaymentGateway,
  ) {}

  async getOrCreateCustomer(user: User): Promise<GatewayCustomer> {
    const gatewayName = 'stripe';

    let customer = await this.gatewayCustomerRepository.findOne({
      where: { user_id: user.id, gateway: gatewayName },
    });

    if (!customer) {
      const gatewayCustomer = await this.paymentGateway.createCustomer({
        email: user.email,
        name: user.name,
        metadata: { userId: user.id },
      });

      customer = this.gatewayCustomerRepository.create({
        user_id: user.id,
        gateway: gatewayName,
        gateway_customer_id: gatewayCustomer.id,
      });

      await this.gatewayCustomerRepository.save(customer);
    }

    return customer;
  }

  async createGatewaySubscription(input: CreateSubscriptionInput): Promise<PaymentGatewaySubscription> {
    return this.paymentGateway.createSubscription(input);
  }

  async cancelGatewaySubscription(subscriptionId: string): Promise<PaymentGatewaySubscription> {
    return this.paymentGateway.cancelSubscription(subscriptionId);
  }

  async createCheckoutSession(input: {
    customerId: string;
    priceId: string;
    successUrl: string;
    cancelUrl: string;
    metadata?: Record<string, string>;
  }): Promise<{ url: string; sessionId: string }> {
    return this.paymentGateway.createCheckoutSession(input);
  }

  async processPayment(amount: number, currency: string, paymentMethodId: string): Promise<any> {
    // TODO: Integrate with actual Payment Gateway for one-off payments
    return {
      success: true,
      transactionId: `mock_tx_${Date.now()}`,
    };
  }

  async handleWebhookEvent(event: any): Promise<void> {
    switch (event.type) {
      case 'invoice.payment_succeeded':
        await this.handleInvoicePaymentSucceeded(event.data.object);
        break;
      // Add other event handlers here as needed
      default:
        console.log(`Unhandled event type ${event.type}`);
    }
  }

  private async handleInvoicePaymentSucceeded(invoice: any) {
    const subscriptionId = invoice.parent.subscription_details.subscription;
    const paymentIntentId = invoice.payment_intent;
    const amount = invoice.amount_paid;
    const currency = invoice.currency;
    const hostedInvoiceUrl = invoice.hosted_invoice_url;

    console.log(`Payment succeeded for subscription ${subscriptionId}`);

    const payment = this.paymentRepository.create({
      gateway_transaction_id: typeof paymentIntentId === 'string' ? paymentIntentId : paymentIntentId?.id || invoice.number,
      amount: amount,
      currency: currency,
      status: 'succeeded',
      invoice_url: hostedInvoiceUrl,
    } as any);

    await this.paymentRepository.save(payment);
  }
}
