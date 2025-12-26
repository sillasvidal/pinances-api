import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

@Entity('cards')
export class Card {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 50 })
  brand: string; // e.g., "Visa", "Mastercard"

  @Column({ type: 'varchar', length: 4 })
  last_digits: string;

  @Column({
    type: 'bigint',
    nullable: true,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => (value ? parseInt(value, 10) : null),
    },
  })
  total_limit: number;

  @Column({ type: 'integer' })
  closing_day: number; // Day of month (1-31)

  @Column({ type: 'integer' })
  due_day: number; // Day of month (1-31)

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne('User', 'cards')
  @JoinColumn({ name: 'user_id' })
  user: any;

  @Column({ type: 'uuid' })
  user_id: string;

  @OneToMany('Invoice', 'card')
  invoices: any[];

  @OneToMany('Commitment', 'card')
  commitments: any[];
}
