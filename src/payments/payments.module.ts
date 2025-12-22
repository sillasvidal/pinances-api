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
    {
      provide: 'PAYMENT_GATEWAY',
      useClass: StripeGateway,
    },
  ],

  exports: [PaymentsService],
})
export class PaymentsModule {}
