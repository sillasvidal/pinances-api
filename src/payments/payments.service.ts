import { Injectable, Inject, NotFoundException } from '@nestjs/common';
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
    const gatewayName = 'stripe'; // This could be dynamic in the future based on config or user selection

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

  async processPayment(amount: number, currency: string, paymentMethodId: string): Promise<any> {
    // TODO: Integrate with actual Payment Gateway for one-off payments
    return {
      success: true,
      transactionId: `mock_tx_${Date.now()}`,
    };
  }
}
