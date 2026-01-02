export interface CreateCustomerInput {
  email: string;
  name: string;
  metadata?: Record<string, any>;
}

export interface PaymentGatewayCustomer {
  id: string;
  email: string;
}

export interface CreateSubscriptionInput {
  customerId: string;
  planId: string;
  paymentMethodId?: string;
  metadata?: Record<string, any>;
}

export interface PaymentGatewaySubscription {
  id: string;
  status: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  customerId: string;
  planId?: string;
}

export interface PaymentGateway {
  createCustomer(input: CreateCustomerInput): Promise<PaymentGatewayCustomer>;
  createSubscription(input: CreateSubscriptionInput): Promise<PaymentGatewaySubscription>;
  createCheckoutSession(input: {
    customerId: string;
    priceId: string;
    successUrl: string;
    cancelUrl: string;
    metadata?: Record<string, string>;
  }): Promise<{ url: string; sessionId: string }>;
  cancelSubscription(subscriptionId: string): Promise<PaymentGatewaySubscription>;
  constructEventFromPayload(signature: string, payload: Buffer): Promise<any>;
}

export const PAYMENT_GATEWAY = 'PAYMENT_GATEWAY';
