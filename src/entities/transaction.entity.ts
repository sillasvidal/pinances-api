import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Account } from './account.entity';
import { Invoice } from './invoice.entity';
import { Commitment } from './commitment.entity';

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 200 })
  description: string;

  @Column({ type: 'enum', enum: ['expense', 'income', 'transfer'] })
  type: 'expense' | 'income' | 'transfer';

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount: number;

  @Column({ type: 'date' })
  transaction_date: Date; // Impacts cash flow

  @ManyToOne(() => Account, (account) => account.transactions, {
    nullable: true,
  })
  @JoinColumn({ name: 'account_id' })
  account: Account;

  @Column({ type: 'uuid', nullable: true })
  account_id: string;

  @ManyToOne(() => Invoice, (invoice) => invoice.transactions, {
    nullable: true,
  })
  @JoinColumn({ name: 'invoice_id' })
  invoice: Invoice;

  @Column({ type: 'uuid', nullable: true })
  invoice_id: string;

  @ManyToOne(() => Commitment, (commitment) => commitment.transactions, {
    nullable: true,
  })
  @JoinColumn({ name: 'commitment_id' })
  commitment: Commitment;

  @Column({ type: 'uuid', nullable: true })
  commitment_id: string;

  @Column({ type: 'integer', nullable: true })
  installment_number: number; // e.g., 1, 2, 3... (if it's an installment)

  @Column({ type: 'varchar', length: 100, nullable: true })
  category: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne('User', 'transactions')
  @JoinColumn({ name: 'user_id' })
  user: any;

  @Column({ type: 'uuid' })
  user_id: string;
}
