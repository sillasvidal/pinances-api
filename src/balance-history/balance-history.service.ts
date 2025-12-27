import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThanOrEqual } from 'typeorm';
import { BalanceHistory } from '../entities/balance-history.entity';
import { Account } from '../entities/account.entity';

@Injectable()
export class BalanceHistoryService {
    constructor(
        @InjectRepository(BalanceHistory)
        private readonly balanceHistoryRepository: Repository<BalanceHistory>,
        @InjectRepository(Account)
        private readonly accountRepository: Repository<Account>,
    ) { }

    async createSnapshot(
        accountId: string,
        date: Date,
        balance: number,
        userId: string,
    ): Promise<BalanceHistory> {
        const existing = await this.balanceHistoryRepository.findOne({
            where: { account_id: accountId, date },
        });

        if (existing) {
            existing.balance = balance;
            return this.balanceHistoryRepository.save(existing);
        }

        const snapshot = this.balanceHistoryRepository.create({
            account_id: accountId,
            date,
            balance,
            user_id: userId,
        });
        return this.balanceHistoryRepository.save(snapshot);
    }

    async getEvolution(userId: string, months: number = 6) {
        const today = new Date();
        const startDate = new Date(today);
        startDate.setMonth(today.getMonth() - months);
        startDate.setDate(1);

        const snapshots = await this.balanceHistoryRepository.find({
            where: {
                user_id: userId,
                date: Between(startDate, today),
            },
            order: { date: 'ASC' },
            relations: ['account'],
        });

        const monthlyBalances = new Map<string, number>();

        snapshots.forEach((snapshot) => {
            const monthKey = snapshot.date.toISOString().slice(0, 7);
            const currentTotal = monthlyBalances.get(monthKey) || 0;
            monthlyBalances.set(monthKey, currentTotal + Number(snapshot.balance));
        });

        const result = Array.from(monthlyBalances.entries()).map(([key, value]) => {
            const [year, month] = key.split('-');
            const date = new Date(parseInt(year), parseInt(month) - 1, 1);
            const monthName = date.toLocaleString('pt-BR', { month: 'short' });
            const monthLabel = monthName.charAt(0).toUpperCase() + monthName.slice(1);

            return {
                month: monthLabel,
                value: value,
                originalDate: key,
            };
        });
        return result.sort((a, b) => a.originalDate.localeCompare(b.originalDate));
    }

    async recalculateSubsequentSnapshots(
        accountId: string,
        transactionDate: Date,
        amountDelta: number,
    ) {
        await this.balanceHistoryRepository
            .createQueryBuilder()
            .update(BalanceHistory)
            .set({
                balance: () => `balance + ${amountDelta}`,
            })
            .where('account_id = :accountId', { accountId })
            .andWhere('date >= :transactionDate', { transactionDate })
            .execute();
    }
}
