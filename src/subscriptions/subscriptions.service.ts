import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subscription, SubscriptionStatus } from '../entities/subscription.entity';
import { SubscriptionLog } from '../entities/subscription-log.entity';
import { Plan } from '../entities/plan.entity';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { User } from '../entities/user.entity';

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
    @InjectRepository(SubscriptionLog)
    private readonly logRepository: Repository<SubscriptionLog>,
    @InjectRepository(Plan)
    private readonly planRepository: Repository<Plan>,
  ) {}

  async create(createSubscriptionDto: CreateSubscriptionDto, user: User): Promise<Subscription> {
    const { plan_id, payment_method_id } = createSubscriptionDto;

    const plan = await this.planRepository.findOne({ where: { id: plan_id } });
    if (!plan) {
      throw new NotFoundException('Plan not found');
    }

    if (!plan.active) {
      throw new BadRequestException('Plan is not active');
    }

    // Check if user already has an active subscription
    const existingSubscription = await this.subscriptionRepository.findOne({
      where: {
        user_id: user.id,
        status: SubscriptionStatus.ACTIVE,
      },
    });

    if (existingSubscription) {
      throw new BadRequestException('User already has an active subscription');
    }

    const startDate = new Date();
    const currentPeriodStart = new Date(startDate);
    const currentPeriodEnd = new Date(startDate);
    
    if (plan.interval === 'monthly') {
      currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);
    } else if (plan.interval === 'yearly') {
      currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 1);
    }

    const subscription = this.subscriptionRepository.create({
      user,
      plan,
      status: SubscriptionStatus.ACTIVE, // Assuming immediate activation for now
      start_date: startDate,
      current_period_start: currentPeriodStart,
      current_period_end: currentPeriodEnd,
      payment_method_id,
    });

    const savedSubscription = await this.subscriptionRepository.save(subscription);

    await this.logAction(savedSubscription, 'created', null, 'active', { planId: plan.id });

    return savedSubscription;
  }

  async findAll(userId: string): Promise<Subscription[]> {
    return await this.subscriptionRepository.find({
      where: { user_id: userId },
      relations: ['plan'],
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: string, userId: string): Promise<Subscription> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { id, user_id: userId },
      relations: ['plan', 'logs'],
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    return subscription;
  }

  async cancel(id: string, userId: string): Promise<Subscription> {
    const subscription = await this.findOne(id, userId);

    if (subscription.status === SubscriptionStatus.CANCELED) {
      throw new BadRequestException('Subscription is already canceled');
    }

    const oldStatus = subscription.status;
    subscription.status = SubscriptionStatus.CANCELED;
    subscription.cancel_at_period_end = true; // Typically you cancel at end of period

    const savedSubscription = await this.subscriptionRepository.save(subscription);

    await this.logAction(savedSubscription, 'canceled', oldStatus, 'canceled', { userId });

    return savedSubscription;
  }

  private async logAction(
    subscription: Subscription,
    action: string,
    previousStatus: string | null | undefined, // Allow undefined too
    newStatus: string,
    details?: any,
  ) {
    const log = this.logRepository.create({
      subscription,
      action,
      previous_status: previousStatus ?? null, // Ensure null if undefined
      new_status: newStatus,
      details,
    } as any); // Cast to any to bypass strict type check on create for now if needed, or better, fix entity type
    await this.logRepository.save(log);
  }
}
