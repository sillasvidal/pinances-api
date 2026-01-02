import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subscription, SubscriptionStatus } from '../entities/subscription.entity';
import { SubscriptionLog } from '../entities/subscription-log.entity';
import { Plan } from '../entities/plan.entity';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { User } from '../entities/user.entity';
import { PaymentsService } from '../payments/payments.service';

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
    @InjectRepository(SubscriptionLog)
    private readonly logRepository: Repository<SubscriptionLog>,
    @InjectRepository(Plan)
    private readonly planRepository: Repository<Plan>,
    private readonly paymentsService: PaymentsService,
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

    // 1. Get or Create Customer in Gateway
    const gatewayCustomer = await this.paymentsService.getOrCreateCustomer(user);

    // 2. Create Subscription in Gateway
    const gatewaySubscription = await this.paymentsService.createGatewaySubscription({
      customerId: gatewayCustomer.gateway_customer_id,
      planId: plan.gateway_plan_id, // Ensure this exists on Plan entity
      paymentMethodId: payment_method_id,
      metadata: {
        userId: user.id,
        planId: plan.id,
      },
    });

    // 3. Create Local Subscription
    const subscription = this.subscriptionRepository.create({
      user,
      plan,
      status: gatewaySubscription.status as any, // Map if necessary
      start_date: new Date(),
      current_period_start: gatewaySubscription.currentPeriodStart,
      current_period_end: gatewaySubscription.currentPeriodEnd,
      payment_method_id,
      gateway_subscription_id: gatewaySubscription.id,
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
    
    if (subscription.gateway_subscription_id) {
        await this.paymentsService.cancelGatewaySubscription(subscription.gateway_subscription_id);
    }

    subscription.status = SubscriptionStatus.CANCELED;
    subscription.cancel_at_period_end = true; // Typically you cancel at end of period

    const savedSubscription = await this.subscriptionRepository.save(subscription);

    await this.logAction(savedSubscription, 'canceled', oldStatus, 'canceled', { userId });

    return savedSubscription;
  }

  private async logAction(
    subscription: Subscription,
    action: string,
    previousStatus: string | null | undefined,
    newStatus: string,
    details?: any,
  ) {
    const log = this.logRepository.create({
      subscription,
      action,
      previous_status: previousStatus ?? null,
      new_status: newStatus,
      details,
    } as any);
    await this.logRepository.save(log);
  }

  async createCheckoutSession(user: User, planId: string, interval: 'monthly' | 'yearly') {
    const gatewayCustomer = await this.paymentsService.getOrCreateCustomer(user);

    const plan = await this.planRepository.findOne({ where: { id: planId } });
    if (!plan) {
        throw new NotFoundException('Plan not found');
    }

    let priceId = '';
    if (interval === 'monthly') {
        priceId = process.env.STRIPE_PRICE_MONTHLY!;
    } else {
        priceId = process.env.STRIPE_PRICE_YEARLY!;
    }

    if (!priceId) {
        throw new InternalServerErrorException('Price ID not configured for this interval');
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    return this.paymentsService.createCheckoutSession({
      customerId: gatewayCustomer.gateway_customer_id,
      priceId: priceId,
      successUrl: `${frontendUrl}/plans/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${frontendUrl}/plans`,
      metadata: {
        userId: user.id,
        planId: plan.id,
        interval,
      },
    });
  }
}
