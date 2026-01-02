import { Injectable, InternalServerErrorException } from '@nestjs/common';
import Stripe from 'stripe';
import {
  CreateCustomerInput,
  CreateSubscriptionInput,
  PaymentGateway,
  PaymentGatewayCustomer,
  PaymentGatewaySubscription,
} from '../interfaces/payment-gateway.interface';

@Injectable()
export class StripeGateway implements PaymentGateway {
  private stripe: Stripe;

  constructor() {
    const apiKey = process.env.STRIPE_SECRET_KEY;
    if (!apiKey) {
      throw new InternalServerErrorException('STRIPE_SECRET_KEY is not defined in environment variables');
    }
    this.stripe = new Stripe(apiKey, {
      apiVersion: '2024-11-20.acacia' as any,
      typescript: true,
    });
  }

  async createCustomer(input: CreateCustomerInput): Promise<PaymentGatewayCustomer> {
    try {
      const customer = await this.stripe.customers.create({
        email: input.email,
        name: input.name,
        metadata: input.metadata,
      });

      return {
        id: customer.id,
        email: customer.email || '',
      };
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to create customer in Stripe: ${error.message}`,
      );
    }
  }

  async createSubscription(input: CreateSubscriptionInput): Promise<PaymentGatewaySubscription> {
    try {
      const subscription = await this.stripe.subscriptions.create({
        customer: input.customerId,
        items: [{ price: input.planId }],
        default_payment_method: input.paymentMethodId,
        metadata: input.metadata,
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
      });

      return this.mapStripeSubscription(subscription);
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to create subscription in Stripe: ${error.message}`,
      );
    }
  }

  async createCheckoutSession(input: {
    customerId: string;
    priceId: string;
    successUrl: string;
    cancelUrl: string;
    metadata?: Record<string, string>;
  }): Promise<{ url: string; sessionId: string }> {
    try {
      const session = await this.stripe.checkout.sessions.create({
        customer: input.customerId,
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [
          {
            price: input.priceId,
            quantity: 1,
          },
        ],
        success_url: input.successUrl,
        cancel_url: input.cancelUrl,
        metadata: input.metadata,
      });

      return {
        url: session.url || '',
        sessionId: session.id,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to create checkout session in Stripe: ${error.message}`,
      );
    }
  }

  async cancelSubscription(subscriptionId: string): Promise<PaymentGatewaySubscription> {
    try {
      const subscription = await this.stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      });

      return this.mapStripeSubscription(subscription);
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to cancel subscription in Stripe: ${error.message}`,
      );
    }
  }

  async constructEventFromPayload(signature: string, payload: Buffer): Promise<any> {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new InternalServerErrorException('Stripe webhook secret is not defined');
    }

    try {
      return this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (error) {
      throw new Error(`Webhook signature verification failed: ${error.message}`);
    }
  }

  private mapStripeSubscription(subscription: Stripe.Subscription): PaymentGatewaySubscription {
    return {
      id: subscription.id,
      status: subscription.status,
      currentPeriodStart: new Date((subscription as any).current_period_start * 1000),
      currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
      customerId: subscription.customer as string,
      planId: subscription.items.data[0]?.price.id,
    };
  }
}
