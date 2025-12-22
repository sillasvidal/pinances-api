import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Subscription } from './subscription.entity';

@Entity('subscription_logs')
export class SubscriptionLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'subscription_id' })
  subscription_id: string;

  @ManyToOne(() => Subscription, (subscription) => subscription.logs)
  @JoinColumn({ name: 'subscription_id' })
  subscription: Subscription;

  @Column({ type: 'varchar', length: 50 })
  action: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  previous_status: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  new_status: string;

  @Column({ type: 'jsonb', nullable: true })
  details: Record<string, any>;

  @CreateDateColumn()
  created_at: Date;
}
