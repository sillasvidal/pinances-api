import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { User } from './user.entity';
import { Plan } from './plan.entity';
import { SubscriptionLog } from './subscription-log.entity';

export enum SubscriptionStatus {
  ACTIVE = 'active',
  CANCELED = 'canceled',
  TRIAL = 'trial',
  SUSPENDED = 'suspended',
}

@Entity('subscriptions')
export class Subscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  user_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'plan_id' })
  plan_id: string;

  @ManyToOne(() => Plan)
  @JoinColumn({ name: 'plan_id' })
  plan: Plan;

  @Column({
    type: 'enum',
    enum: SubscriptionStatus,
    default: SubscriptionStatus.ACTIVE,
  })
  status: SubscriptionStatus;

  @Column({ type: 'timestamp', nullable: true })
  start_date: Date;

  @Column({ type: 'timestamp' })
  current_period_start: Date;

  @Column({ type: 'timestamp' })
  current_period_end: Date;

  @Column({ type: 'boolean', default: false })
  cancel_at_period_end: boolean;

  @Column({ type: 'varchar', nullable: true })
  payment_method_id: string;

  @Column({ type: 'varchar', nullable: true })
  gateway_subscription_id: string;

  @OneToMany(() => SubscriptionLog, (log) => log.subscription)
  logs: SubscriptionLog[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
