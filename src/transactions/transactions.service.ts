import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Transaction } from '../entities/transaction.entity';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { InvoicesService } from '../invoices/invoices.service';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    private readonly invoicesService: InvoicesService,
  ) {}

  async create(
    createTransactionDto: CreateTransactionDto,
    userId: string,
  ): Promise<Transaction> {
    // If transaction has invoice_id, auto-create invoice if needed
    if (createTransactionDto.invoice_id) {
      // Invoice already specified, just use it
      const transaction = this.transactionRepository.create({
        ...createTransactionDto,
        user_id: userId,
      });
      const savedTransaction = await this.transactionRepository.save(transaction);
      
      // Update invoice total
      await this.invoicesService.updateInvoiceTotal(createTransactionDto.invoice_id);
      
      return savedTransaction;
    }
    
    // Check if this is a card transaction (has invoice but not specified)
    // For now, we'll just create the transaction
    // In the future, you could add logic to detect card transactions
    const transaction = this.transactionRepository.create({
      ...createTransactionDto,
      user_id: userId,
    });
    return await this.transactionRepository.save(transaction);
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
    const transaction = await this.findOne(id, userId);
    Object.assign(transaction, updateTransactionDto);
    return await this.transactionRepository.save(transaction);
  }

  async remove(id: string, userId: string): Promise<void> {
    const transaction = await this.findOne(id, userId);
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
