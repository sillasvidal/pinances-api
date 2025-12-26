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

@Entity('invoices')
export class Invoice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Card, (card) => card.invoices)
  @JoinColumn({ name: 'card_id' })
  card: Card;

  @Column({ type: 'uuid' })
  card_id: string;

  @Column({ type: 'date' })
  closing_date: Date;

  @Column({ type: 'date' })
  due_date: Date;

  @Column({
    type: 'bigint',
    default: 0,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseInt(value, 10),
    },
  })
  total_amount: number;

  @Column({
    type: 'bigint',
    default: 0,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseInt(value, 10),
    },
  })
  paid_amount: number;

  @Column({
    type: 'enum',
    enum: ['open', 'closed', 'paid', 'overdue'],
  })
  status: 'open' | 'closed' | 'paid' | 'overdue';

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany('Transaction', 'invoice')
  transactions: any[];
}
