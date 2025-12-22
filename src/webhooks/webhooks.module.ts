import { Module } from '@nestjs/common';
import { PaymentsModule } from '../payments/payments.module';
import { StripeWebhooksController } from './stripe/stripe-webhooks.controller';

@Module({
  imports: [PaymentsModule],
  controllers: [StripeWebhooksController],
  providers: [],
})
export class WebhooksModule {}
