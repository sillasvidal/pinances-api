import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum PlanInterval {
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
}

@Entity('plans')
export class Plan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'integer' })
  price_in_cents: number;

  @Column({ type: 'varchar', length: 3, default: 'BRL' })
  currency: string;

  @Column({
    type: 'enum',
    enum: PlanInterval,
    default: PlanInterval.MONTHLY,
  })
  interval: PlanInterval;

  @Column({ type: 'jsonb', nullable: true })
  features: Record<string, any>;

  @Column({ type: 'varchar', nullable: true })
  gateway_plan_id: string;

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
