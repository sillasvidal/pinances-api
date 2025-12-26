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

@Entity('accounts')
export class Account {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'enum', enum: ['checking', 'investment'] })
  type: 'checking' | 'investment';

  @Column({
    type: 'bigint',
    default: 0,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseInt(value, 10),
    },
  })
  current_balance: number;

  @Column({
    type: 'bigint',
    default: 0,
    nullable: true,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => (value ? parseInt(value, 10) : null),
    },
  })
  commitment_reserve: number; // Only for investment accounts

  @Column({ type: 'varchar', length: 50, nullable: true })
  institution: string; // e.g., "Sofisa", "Nubank"

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne('User', 'accounts')
  @JoinColumn({ name: 'user_id' })
  user: any;

  @Column({ type: 'uuid' })
  user_id: string;

  @OneToMany('Transaction', 'account')
  transactions: any[];

  @OneToMany('Commitment', 'source_account')
  commitments: any[];
}
