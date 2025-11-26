import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Transaction } from '../entities/transaction.entity';
import { Commitment } from '../entities/commitment.entity';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    @InjectRepository(Commitment)
    private readonly commitmentRepository: Repository<Commitment>,
  ) {}

  async getCashFlowReport(
    userId: string,
    startDate: string,
    endDate: string,
  ): Promise<{
    period: { start: string; end: string };
    income: number;
    expenses: number;
    balance: number;
    by_category: { category: string; amount: number }[];
  }> {
    const transactions = await this.transactionRepository.find({
      where: {
        user_id: userId,
        transaction_date: Between(new Date(startDate), new Date(endDate)),
      },
      order: { transaction_date: 'ASC' },
    });

    const income = transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const expenses = transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    // Group expenses by category
    const categoryMap = new Map<string, number>();
    transactions
      .filter((t) => t.type === 'expense' && t.category)
      .forEach((t) => {
        const current = categoryMap.get(t.category!) || 0;
        categoryMap.set(t.category!, current + Number(t.amount));
      });

    const by_category = Array.from(categoryMap.entries()).map(
      ([category, amount]) => ({ category, amount }),
    );

    return {
      period: { start: startDate, end: endDate },
      income,
      expenses,
      balance: income - expenses,
      by_category,
    };
  }

  async getAccrualReport(
    userId: string,
    startDate: string,
    endDate: string,
  ): Promise<{
    period: { start: string; end: string };
    income: number;
    expenses: number;
    balance: number;
    by_category: { category: string; amount: number }[];
  }> {
    // Get commitments assumed in this period
    const commitments = await this.commitmentRepository.find({
      where: {
        user_id: userId,
        accrual_date: Between(new Date(startDate), new Date(endDate)),
        active: true,
      },
      order: { accrual_date: 'ASC' },
    });

    // Get non-commitment transactions (one-time purchases)
    const transactions = await this.transactionRepository.find({
      where: {
        user_id: userId,
        transaction_date: Between(new Date(startDate), new Date(endDate)),
        commitment_id: null as any, // Transactions not linked to commitments
      },
      order: { transaction_date: 'ASC' },
    });

    // Calculate income from commitments
    const commitmentIncome = commitments
      .filter((c) => c.type === 'income')
      .reduce((sum, c) => sum + Number(c.total_amount), 0);

    // Calculate expenses from commitments
    const commitmentExpenses = commitments
      .filter((c) => c.type === 'expense')
      .reduce((sum, c) => sum + Number(c.total_amount), 0);

    // Calculate income from one-time transactions
    const transactionIncome = transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    // Calculate expenses from one-time transactions
    const transactionExpenses = transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalIncome = commitmentIncome + transactionIncome;
    const totalExpenses = commitmentExpenses + transactionExpenses;

    // Group by category (commitments + transactions)
    const categoryMap = new Map<string, number>();

    commitments
      .filter((c) => c.type === 'expense' && c.category)
      .forEach((c) => {
        const current = categoryMap.get(c.category!) || 0;
        categoryMap.set(c.category!, current + Number(c.total_amount));
      });

    transactions
      .filter((t) => t.type === 'expense' && t.category)
      .forEach((t) => {
        const current = categoryMap.get(t.category!) || 0;
        categoryMap.set(t.category!, current + Number(t.amount));
      });

    const by_category = Array.from(categoryMap.entries()).map(
      ([category, amount]) => ({ category, amount }),
    );

    return {
      period: { start: startDate, end: endDate },
      income: totalIncome,
      expenses: totalExpenses,
      balance: totalIncome - totalExpenses,
      by_category,
    };
  }

  async getComparativeReport(
    userId: string,
    startDate: string,
    endDate: string,
  ): Promise<{
    period: { start: string; end: string };
    cash_flow: {
      income: number;
      expenses: number;
      balance: number;
    };
    accrual: {
      income: number;
      expenses: number;
      balance: number;
    };
    difference: {
      income: number;
      expenses: number;
      balance: number;
    };
  }> {
    const cashFlow = await this.getCashFlowReport(userId, startDate, endDate);
    const accrual = await this.getAccrualReport(userId, startDate, endDate);

    return {
      period: { start: startDate, end: endDate },
      cash_flow: {
        income: cashFlow.income,
        expenses: cashFlow.expenses,
        balance: cashFlow.balance,
      },
      accrual: {
        income: accrual.income,
        expenses: accrual.expenses,
        balance: accrual.balance,
      },
      difference: {
        income: accrual.income - cashFlow.income,
        expenses: accrual.expenses - cashFlow.expenses,
        balance: accrual.balance - cashFlow.balance,
      },
    };
  }

  async getMonthlyProjection(
    userId: string,
    months: number = 12,
  ): Promise<{
    projections: {
      month: string;
      expected_expenses: number;
      committed_expenses: number;
    }[];
  }> {
    const today = new Date();
    const projections: {
      month: string;
      expected_expenses: number;
      committed_expenses: number;
    }[] = [];

    // Get all active commitments
    const commitments = await this.commitmentRepository.find({
      where: { user_id: userId, active: true },
      relations: ['transactions'],
    });

    for (let i = 0; i < months; i++) {
      const monthDate = new Date(today.getFullYear(), today.getMonth() + i, 1);
      const monthEnd = new Date(
        monthDate.getFullYear(),
        monthDate.getMonth() + 1,
        0,
      );

      let committedExpenses = 0;

      // Calculate committed expenses for this month
      commitments.forEach((commitment) => {
        if (commitment.type === 'expense') {
          const firstInstallment = new Date(commitment.first_installment_date);
          const paidCount = commitment.transactions?.length || 0;

          // Calculate which installments fall in this month
          for (let inst = paidCount; inst < commitment.installments_count; inst++) {
            let installmentDate = new Date(firstInstallment);

            if (commitment.frequency === 'monthly') {
              installmentDate.setMonth(firstInstallment.getMonth() + inst);
            } else if (commitment.frequency === 'weekly') {
              installmentDate.setDate(firstInstallment.getDate() + inst * 7);
            } else if (commitment.frequency === 'annual') {
              installmentDate.setFullYear(firstInstallment.getFullYear() + inst);
            }

            if (
              installmentDate >= monthDate &&
              installmentDate <= monthEnd
            ) {
              committedExpenses += Number(commitment.installment_amount);
            }
          }
        }
      });

      projections.push({
        month: monthDate.toISOString().substring(0, 7), // YYYY-MM
        expected_expenses: committedExpenses,
        committed_expenses: committedExpenses,
      });
    }

    return { projections };
  }
}
