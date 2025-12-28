import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Transaction } from '../entities/transaction.entity';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { InvoicesService } from '../invoices/invoices.service';
import { AccountsService } from '../accounts/accounts.service';
import { BalanceHistoryService } from '../balance-history/balance-history.service';
import { parse } from 'csv-parse/sync';
import { ImportResultDto } from './dto/import-transactions.dto';

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

    if (transaction.account_id) {
      const amount = Number(transaction.amount);
      const isIncome = transaction.type === 'income';
      const delta = isIncome ? amount : -amount;
      await this.accountsService.updateBalance(transaction.account_id, -delta, userId);

      await this.balanceHistoryService.recalculateSubsequentSnapshots(
        transaction.account_id,
        new Date(transaction.transaction_date),
        -delta
      );
    }

    await this.transactionRepository.softRemove(transaction);
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


  async importFromCSV(csvContent: string, userId: string): Promise<ImportResultDto> {
    const result: ImportResultDto = {
      success: 0,
      failed: 0,
      errors: [],
      transactions: [],
    };

    try {
      // Parse CSV with semicolon delimiter
      const records = parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        delimiter: ';',
      });

      // Process each row
      for (let i = 0; i < records.length; i++) {
        const row: any = records[i];
        const rowNumber = i + 2; // +2 because of header and 0-index

        try {
          // Validate required fields (Date, Description, Value)
          if (!row.Date || !row.Description || !row.Value) {
            result.errors.push({
              row: rowNumber,
              error: 'Missing required fields (Date, Description, Value)',
            });
            result.failed++;
            continue;
          }

          // Parse amount (Value column)
          const amount = parseFloat(row.Value.replace(',', '.'));
          if (isNaN(amount) || amount === 0) {
            result.errors.push({
              row: rowNumber,
              error: `Invalid amount: ${row.Value}`,
            });
            result.failed++;
            continue;
          }

          // Determine type based on amount (negative = expense, positive = income)
          const type: 'expense' | 'income' = amount < 0 ? 'expense' : 'income';
          const absoluteAmount = Math.abs(amount);

          // Convert amount to cents
          const amountInCents = Math.round(absoluteAmount * 100);

          // Parse date (support both YYYY-MM-DD and DD/MM/YYYY)
          let transactionDate: Date;
          if (row.Date.includes('/')) {
            const [day, month, year] = row.Date.split('/');
            transactionDate = new Date(`${year}-${month}-${day}`);
          } else {
            transactionDate = new Date(row.Date);
          }

          if (isNaN(transactionDate.getTime())) {
            result.errors.push({
              row: rowNumber,
              error: `Invalid date format: ${row.Date}`,
            });
            result.failed++;
            continue;
          }

          // Find or create account if Account name provided
          let accountId: string | undefined;
          if (row.Account && row.Account.trim()) {
            try {
              const accounts = await this.accountsService.findAll(userId);
              let account = accounts.find(a => a.name === row.Account.trim());
              
              // Create account if it doesn't exist
              if (!account) {
                account = await this.accountsService.create({
                  name: row.Account.trim(),
                  type: 'checking',
                }, userId);
              }
              
              accountId = account?.id;
            } catch (error) {
              // If account creation fails, continue without account
              result.errors.push({
                row: rowNumber,
                error: `Failed to create/find account: ${error.message}`,
              });
            }
          }

          // Use Category field
          const category = row.Category && row.Category.trim() ? row.Category.trim() : undefined;

          // Create transaction
          const transactionDto: CreateTransactionDto = {
            description: row.Description.trim(),
            type: type,
            amount: amountInCents,
            transaction_date: transactionDate.toISOString().split('T')[0],
            category: category,
            notes: row.Tags || undefined,
            account_id: accountId,
          };

          const transaction = await this.create(transactionDto, userId);
          result.transactions.push(transaction);
          result.success++;
        } catch (error) {
          result.errors.push({
            row: rowNumber,
            error: error.message || 'Unknown error',
          });
          result.failed++;
        }
      }

      return result;
    } catch (error) {
      throw new Error(`Failed to parse CSV: ${error.message}`);
    }
  }
}
