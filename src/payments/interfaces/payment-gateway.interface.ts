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
  cancelSubscription(subscriptionId: string): Promise<PaymentGatewaySubscription>;
}

export const PAYMENT_GATEWAY = 'PAYMENT_GATEWAY';
