import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Card } from './card.entity';
import { Account } from './account.entity';

@Entity('commitments')
export class Commitment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 200 })
  description: string;

  @Column({ type: 'enum', enum: ['expense', 'income'] })
  type: 'expense' | 'income';

  @Column({
    type: 'bigint',
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseInt(value, 10),
    },
  })
  total_amount: number;

  @Column({ type: 'integer' })
  installments_count: number;

  @Column({
    type: 'bigint',
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseInt(value, 10),
    },
  })
  installment_amount: number;

  @Column({ type: 'date' })
  accrual_date: Date;

  @Column({ type: 'date' })
  first_installment_date: Date;

  @Column({ type: 'enum', enum: ['monthly', 'weekly', 'annual'] })
  frequency: 'monthly' | 'weekly' | 'annual';

  @ManyToOne(() => Card, (card) => card.commitments, { nullable: true })
  @JoinColumn({ name: 'card_id' })
  card: Card;

  @Column({ type: 'uuid', nullable: true })
  card_id: string;

  @ManyToOne(() => Account, (account) => account.commitments, {
    nullable: true,
  })
  @JoinColumn({ name: 'source_account_id' })
  source_account: Account;

  @Column({ type: 'uuid', nullable: true })
  source_account_id: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  category: string;

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne('User', 'commitments')
  @JoinColumn({ name: 'user_id' })
  user: any;

  @Column({ type: 'uuid' })
  user_id: string;

  @OneToMany('Transaction', 'commitment')
  transactions: any[];
}
