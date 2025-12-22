import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Subscription } from './subscription.entity';

export enum BillingInvoiceStatus {
  OPEN = 'open',
  PAID = 'paid',
  VOID = 'void',
  UNCOLLECTIBLE = 'uncollectible',
}

@Entity('billing_invoices')
export class BillingInvoice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'subscription_id' })
  subscription_id: string;

  @ManyToOne(() => Subscription)
  @JoinColumn({ name: 'subscription_id' })
  subscription: Subscription;

  @Column({ type: 'integer' })
  amount: number;

  @Column({ type: 'varchar', length: 3, default: 'BRL' })
  currency: string;

  @Column({
    type: 'enum',
    enum: BillingInvoiceStatus,
    default: BillingInvoiceStatus.OPEN,
  })
  status: BillingInvoiceStatus;

  @Column({ type: 'varchar', nullable: true })
  hosted_invoice_url: string;

  @Column({ type: 'varchar', nullable: true })
  pdf: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
