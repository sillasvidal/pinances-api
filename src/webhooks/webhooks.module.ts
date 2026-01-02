import { Module } from '@nestjs/common';
import { PaymentsModule } from '../payments/payments.module';
import { StripeWebhooksController } from './stripe/stripe-webhooks.controller';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';

@Module({
  imports: [PaymentsModule, SubscriptionsModule],
  controllers: [StripeWebhooksController],
  providers: [],
})
export class WebhooksModule {}
