import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentsService } from './payments.service';
import { Payment } from '../entities/payment.entity';
import { GatewayCustomer } from '../entities/gateway-customer.entity';
import { StripeGateway } from './gateways/stripe.gateway';



@Module({
  imports: [TypeOrmModule.forFeature([Payment, GatewayCustomer])],
  controllers: [],
  providers: [
    PaymentsService,
    StripeGateway,
    {
      provide: 'PAYMENT_GATEWAY',
      useExisting: StripeGateway,
    },
  ],

  exports: [PaymentsService, 'PAYMENT_GATEWAY', StripeGateway],
})
export class PaymentsModule {}
