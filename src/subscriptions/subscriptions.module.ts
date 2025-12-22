import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionsController } from './subscriptions.controller';
import { Subscription } from '../entities/subscription.entity';
import { SubscriptionLog } from '../entities/subscription-log.entity';
import { Plan } from '../entities/plan.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Subscription, SubscriptionLog, Plan]),
  ],
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService],
  exports: [SubscriptionsService],
})
export class SubscriptionsModule {}
