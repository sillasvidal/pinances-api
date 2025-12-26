import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
} from 'typeorm';
import { Account } from './account.entity';

@Entity('balance_history')
@Index(['account_id', 'date'], { unique: true })
export class BalanceHistory {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Account)
    @JoinColumn({ name: 'account_id' })
    account: Account;

    @Column({ type: 'uuid' })
    account_id: string;

    @Column({ type: 'date' })
    date: Date;

    @Column({
        type: 'bigint',
        transformer: {
            to: (value: number) => value,
            from: (value: string) => parseInt(value, 10),
        },
    })
    balance: number;

    @ManyToOne('User')
    @JoinColumn({ name: 'user_id' })
    user: any;

    @Column({ type: 'uuid' })
    user_id: string;

    @CreateDateColumn()
    created_at: Date;
}
