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
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
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
