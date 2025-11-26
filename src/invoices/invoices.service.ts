import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThanOrEqual } from 'typeorm';
import { Invoice } from '../entities/invoice.entity';
import { Card } from '../entities/card.entity';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';

@Injectable()
export class InvoicesService {
  constructor(
    @InjectRepository(Invoice)
    private readonly invoiceRepository: Repository<Invoice>,
    @InjectRepository(Card)
    private readonly cardRepository: Repository<Card>,
  ) {}

  async create(
    createInvoiceDto: CreateInvoiceDto,
    userId: string,
  ): Promise<Invoice> {
    // Verify card belongs to user
    const card = await this.cardRepository.findOne({
      where: { id: createInvoiceDto.card_id, user_id: userId },
    });

    if (!card) {
      throw new NotFoundException('Card not found');
    }

    const invoice = this.invoiceRepository.create(createInvoiceDto);
    return await this.invoiceRepository.save(invoice);
  }

  async findAll(
    userId: string,
    filters?: {
      cardId?: string;
      status?: 'open' | 'closed' | 'paid' | 'overdue';
      startDate?: string;
      endDate?: string;
    },
  ): Promise<Invoice[]> {
    const queryBuilder = this.invoiceRepository
      .createQueryBuilder('invoice')
      .leftJoinAndSelect('invoice.card', 'card')
      .where('card.user_id = :userId', { userId });

    if (filters?.cardId) {
      queryBuilder.andWhere('invoice.card_id = :cardId', {
        cardId: filters.cardId,
      });
    }

    if (filters?.status) {
      queryBuilder.andWhere('invoice.status = :status', {
        status: filters.status,
      });
    }

    if (filters?.startDate && filters?.endDate) {
      queryBuilder.andWhere(
        'invoice.due_date BETWEEN :startDate AND :endDate',
        {
          startDate: filters.startDate,
          endDate: filters.endDate,
        },
      );
    }

    return await queryBuilder
      .orderBy('invoice.due_date', 'DESC')
      .getMany();
  }

  async findOne(id: string, userId: string): Promise<Invoice> {
    const invoice = await this.invoiceRepository
      .createQueryBuilder('invoice')
      .leftJoinAndSelect('invoice.card', 'card')
      .leftJoinAndSelect('invoice.transactions', 'transactions')
      .where('invoice.id = :id', { id })
      .andWhere('card.user_id = :userId', { userId })
      .getOne();

    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${id} not found`);
    }

    return invoice;
  }

  async update(
    id: string,
    updateInvoiceDto: UpdateInvoiceDto,
    userId: string,
  ): Promise<Invoice> {
    const invoice = await this.findOne(id, userId);
    Object.assign(invoice, updateInvoiceDto);
    return await this.invoiceRepository.save(invoice);
  }

  async remove(id: string, userId: string): Promise<void> {
    const invoice = await this.findOne(id, userId);
    await this.invoiceRepository.remove(invoice);
  }

  async payInvoice(
    id: string,
    amount: number,
    userId: string,
  ): Promise<Invoice> {
    const invoice = await this.findOne(id, userId);

    const newPaidAmount = Number(invoice.paid_amount) + amount;

    if (newPaidAmount > Number(invoice.total_amount)) {
      throw new BadRequestException(
        'Payment amount exceeds invoice total',
      );
    }

    invoice.paid_amount = newPaidAmount;

    // Update status based on payment
    if (newPaidAmount >= Number(invoice.total_amount)) {
      invoice.status = 'paid';
    }

    return await this.invoiceRepository.save(invoice);
  }

  async closeInvoice(id: string, userId: string): Promise<Invoice> {
    const invoice = await this.findOne(id, userId);

    if (invoice.status !== 'open') {
      throw new BadRequestException('Only open invoices can be closed');
    }

    invoice.status = 'closed';
    return await this.invoiceRepository.save(invoice);
  }

  async updateOverdueInvoices(): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await this.invoiceRepository
      .createQueryBuilder()
      .update(Invoice)
      .set({ status: 'overdue' })
      .where('status IN (:...statuses)', { statuses: ['open', 'closed'] })
      .andWhere('due_date < :today', { today })
      .andWhere('paid_amount < total_amount')
      .execute();
  }

  async generateMonthlyInvoice(
    cardId: string,
    userId: string,
  ): Promise<Invoice> {
    // Verify card belongs to user
    const card = await this.cardRepository.findOne({
      where: { id: cardId, user_id: userId },
    });

    if (!card) {
      throw new NotFoundException('Card not found');
    }

    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();

    // Calculate closing and due dates
    const closingDate = new Date(year, month, card.closing_day);
    const dueDate = new Date(year, month, card.due_day);

    // If due day is before closing day, due date is next month
    if (card.due_day < card.closing_day) {
      dueDate.setMonth(dueDate.getMonth() + 1);
    }

    const invoice = this.invoiceRepository.create({
      card_id: cardId,
      closing_date: closingDate,
      due_date: dueDate,
      total_amount: 0,
      paid_amount: 0,
      status: 'open',
    });

    return await this.invoiceRepository.save(invoice);
  }

  async findOrCreateInvoiceForTransaction(
    cardId: string,
    transactionDate: Date,
    userId: string,
  ): Promise<Invoice> {
    // Verify card belongs to user
    const card = await this.cardRepository.findOne({
      where: { id: cardId, user_id: userId },
    });

    if (!card) {
      throw new NotFoundException('Card not found');
    }

    // Determine which invoice period this transaction belongs to
    const txDate = new Date(transactionDate);
    const txYear = txDate.getFullYear();
    const txMonth = txDate.getMonth();
    const txDay = txDate.getDate();

    // Calculate the invoice period
    let invoiceMonth = txMonth;
    let invoiceYear = txYear;

    // If transaction is after closing day, it goes to next month's invoice
    if (txDay > card.closing_day) {
      invoiceMonth++;
      if (invoiceMonth > 11) {
        invoiceMonth = 0;
        invoiceYear++;
      }
    }

    // Calculate closing and due dates for this period
    const closingDate = new Date(invoiceYear, invoiceMonth, card.closing_day);
    const dueDate = new Date(invoiceYear, invoiceMonth, card.due_day);

    // If due day is before closing day, due date is next month
    if (card.due_day < card.closing_day) {
      dueDate.setMonth(dueDate.getMonth() + 1);
    }

    // Try to find existing invoice for this period
    const existingInvoice = await this.invoiceRepository.findOne({
      where: {
        card_id: cardId,
        closing_date: closingDate,
        status: 'open',
      },
    });

    if (existingInvoice) {
      return existingInvoice;
    }

    // Create new invoice if not found
    const invoice = this.invoiceRepository.create({
      card_id: cardId,
      closing_date: closingDate,
      due_date: dueDate,
      total_amount: 0,
      paid_amount: 0,
      status: 'open',
    });

    return await this.invoiceRepository.save(invoice);
  }

  async updateInvoiceTotal(invoiceId: string): Promise<void> {
    const invoice = await this.invoiceRepository
      .createQueryBuilder('invoice')
      .leftJoinAndSelect('invoice.transactions', 'transactions')
      .where('invoice.id = :invoiceId', { invoiceId })
      .getOne();

    if (!invoice) {
      return;
    }

    // Calculate total from all transactions
    const total = invoice.transactions?.reduce(
      (sum, transaction) => sum + Number(transaction.amount),
      0,
    ) || 0;

    invoice.total_amount = total;
    await this.invoiceRepository.save(invoice);
  }
}
