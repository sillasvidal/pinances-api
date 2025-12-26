import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Transaction } from '../entities/transaction.entity';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { InvoicesService } from '../invoices/invoices.service';
import { AccountsService } from '../accounts/accounts.service';
import { BalanceHistoryService } from '../balance-history/balance-history.service';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    private readonly invoicesService: InvoicesService,
    private readonly accountsService: AccountsService,
    private readonly balanceHistoryService: BalanceHistoryService,
  ) { }

  async create(
    createTransactionDto: CreateTransactionDto,
    userId: string,
  ): Promise<Transaction> {
    if (createTransactionDto.invoice_id) {

      const transaction = this.transactionRepository.create({
        ...createTransactionDto,
        user_id: userId,
      });
      const savedTransaction = await this.transactionRepository.save(transaction);


      await this.invoicesService.updateInvoiceTotal(createTransactionDto.invoice_id);

      return savedTransaction;
    }



    const transaction = this.transactionRepository.create({
      ...createTransactionDto,
      user_id: userId,
    });
    const savedTransaction = await this.transactionRepository.save(transaction);


    if (savedTransaction.account_id) {
      const amount = Number(savedTransaction.amount);
      const isIncome = savedTransaction.type === 'income';

      const delta = isIncome ? amount : -amount;

      await this.accountsService.updateBalance(
        savedTransaction.account_id,
        delta,
        userId
      );


      await this.balanceHistoryService.recalculateSubsequentSnapshots(
        savedTransaction.account_id,
        new Date(savedTransaction.transaction_date),
        delta
      );
    }

    return savedTransaction;
  }

  async findAll(
    userId: string,
    filters?: {
      type?: 'expense' | 'income' | 'transfer';
      startDate?: string;
      endDate?: string;
      category?: string;
    },
  ): Promise<Transaction[]> {
    const where: any = { user_id: userId };

    if (filters?.type) {
      where.type = filters.type;
    }

    if (filters?.category) {
      where.category = filters.category;
    }

    if (filters?.startDate && filters?.endDate) {
      where.transaction_date = Between(
        new Date(filters.startDate),
        new Date(filters.endDate),
      );
    }

    return await this.transactionRepository.find({
      where,
      order: { transaction_date: 'DESC', created_at: 'DESC' },
      relations: ['account', 'invoice', 'commitment'],
    });
  }

  async findOne(id: string, userId: string): Promise<Transaction> {
    const transaction = await this.transactionRepository.findOne({
      where: { id, user_id: userId },
      relations: ['account', 'invoice', 'commitment'],
    });

    if (!transaction) {
      throw new NotFoundException(`Transaction with ID ${id} not found`);
    }

    return transaction;
  }

  async update(
    id: string,
    updateTransactionDto: UpdateTransactionDto,
    userId: string,
  ): Promise<Transaction> {
    const oldTransaction = await this.findOne(id, userId);


    if (oldTransaction.account_id) {
      const oldAmount = Number(oldTransaction.amount);
      const oldIsIncome = oldTransaction.type === 'income';
      const oldDelta = oldIsIncome ? oldAmount : -oldAmount;

      await this.accountsService.updateBalance(oldTransaction.account_id, -oldDelta, userId);

      await this.balanceHistoryService.recalculateSubsequentSnapshots(
        oldTransaction.account_id,
        new Date(oldTransaction.transaction_date),
        -oldDelta
      );
    }

    Object.assign(oldTransaction, updateTransactionDto);
    const newTransaction = await this.transactionRepository.save(oldTransaction);

    // Apply new effect
    if (newTransaction.account_id) {
      const newAmount = Number(newTransaction.amount);
      const newIsIncome = newTransaction.type === 'income';
      const newDelta = newIsIncome ? newAmount : -newAmount;
      await this.accountsService.updateBalance(newTransaction.account_id, newDelta, userId);

      await this.balanceHistoryService.recalculateSubsequentSnapshots(
        newTransaction.account_id,
        new Date(newTransaction.transaction_date),
        newDelta
      );
    }

    return newTransaction;
  }

  async remove(id: string, userId: string): Promise<void> {
    const transaction = await this.findOne(id, userId);

    // Revert balance effect before deleting
    if (transaction.account_id) {
      const amount = Number(transaction.amount);
      const isIncome = transaction.type === 'income';
      const delta = isIncome ? amount : -amount;
      // To revert, we do the opposite: subtract delta (or add -delta)
      await this.accountsService.updateBalance(transaction.account_id, -delta, userId);

      await this.balanceHistoryService.recalculateSubsequentSnapshots(
        transaction.account_id,
        new Date(transaction.transaction_date),
        -delta
      );
    }

    await this.transactionRepository.remove(transaction);
  }

  async getStatistics(
    userId: string,
    startDate: string,
    endDate: string,
  ): Promise<{
    total_income: number;
    total_expenses: number;
    total_transfers: number;
    balance: number;
    by_category: { category: string; total: number }[];
  }> {
    const transactions = await this.findAll(userId, { startDate, endDate });

    const income = transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const expenses = transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const transfers = transactions
      .filter((t) => t.type === 'transfer')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    // Group by category
    const categoryMap = new Map<string, number>();
    transactions
      .filter((t) => t.category && t.type === 'expense')
      .forEach((t) => {
        const current = categoryMap.get(t.category!) || 0;
        categoryMap.set(t.category!, current + Number(t.amount));
      });

    const by_category = Array.from(categoryMap.entries()).map(
      ([category, total]) => ({ category, total }),
    );

    return {
      total_income: income,
      total_expenses: expenses,
      total_transfers: transfers,
      balance: income - expenses,
      by_category,
    };
  }
}
