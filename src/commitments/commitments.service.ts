import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Commitment } from '../entities/commitment.entity';
import { Card } from '../entities/card.entity';
import { Account } from '../entities/account.entity';
import { CreateCommitmentDto } from './dto/create-commitment.dto';
import { UpdateCommitmentDto } from './dto/update-commitment.dto';

@Injectable()
export class CommitmentsService {
  constructor(
    @InjectRepository(Commitment)
    private readonly commitmentRepository: Repository<Commitment>,
    @InjectRepository(Card)
    private readonly cardRepository: Repository<Card>,
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,
  ) {}

  async create(
    createCommitmentDto: CreateCommitmentDto,
    userId: string,
  ): Promise<Commitment> {
    // Verify card or account belongs to user
    if (createCommitmentDto.card_id) {
      const card = await this.cardRepository.findOne({
        where: { id: createCommitmentDto.card_id, user_id: userId },
      });
      if (!card) {
        throw new NotFoundException('Card not found');
      }
    }

    if (createCommitmentDto.source_account_id) {
      const account = await this.accountRepository.findOne({
        where: { id: createCommitmentDto.source_account_id, user_id: userId },
      });
      if (!account) {
        throw new NotFoundException('Account not found');
      }

      // Reserve funds in investment account
      if (account.type === 'investment') {
        const totalReserve = Number(createCommitmentDto.total_amount);
        account.commitment_reserve = Number(account.commitment_reserve || 0) + totalReserve;
        await this.accountRepository.save(account);
      }
    }

    const commitment = this.commitmentRepository.create({
      ...createCommitmentDto,
      user_id: userId,
    });

    return await this.commitmentRepository.save(commitment);
  }

  async findAll(
    userId: string,
    filters?: {
      type?: 'expense' | 'income';
      active?: boolean;
      category?: string;
    },
  ): Promise<Commitment[]> {
    const where: any = { user_id: userId };

    if (filters?.type) {
      where.type = filters.type;
    }

    if (filters?.active !== undefined) {
      where.active = filters.active;
    }

    if (filters?.category) {
      where.category = filters.category;
    }

    return await this.commitmentRepository.find({
      where,
      order: { accrual_date: 'DESC' },
      relations: ['card', 'source_account', 'transactions'],
    });
  }

  async findOne(id: string, userId: string): Promise<Commitment> {
    const commitment = await this.commitmentRepository.findOne({
      where: { id, user_id: userId },
      relations: ['card', 'source_account', 'transactions'],
    });

    if (!commitment) {
      throw new NotFoundException(`Commitment with ID ${id} not found`);
    }

    return commitment;
  }

  async update(
    id: string,
    updateCommitmentDto: UpdateCommitmentDto,
    userId: string,
  ): Promise<Commitment> {
    const commitment = await this.findOne(id, userId);
    Object.assign(commitment, updateCommitmentDto);
    return await this.commitmentRepository.save(commitment);
  }

  async remove(id: string, userId: string): Promise<void> {
    const commitment = await this.findOne(id, userId);
    
    // Release reserved funds if from investment account
    if (commitment.source_account_id) {
      const account = await this.accountRepository.findOne({
        where: { id: commitment.source_account_id },
      });
      
      if (account && account.type === 'investment') {
        const paidAmount = commitment.transactions?.reduce(
          (sum, t) => sum + Number(t.amount),
          0,
        ) || 0;
        const remainingAmount = Number(commitment.total_amount) - paidAmount;
        
        account.commitment_reserve = Math.max(
          0,
          Number(account.commitment_reserve || 0) - remainingAmount,
        );
        await this.accountRepository.save(account);
      }
    }

    commitment.active = false;
    await this.commitmentRepository.save(commitment);
  }

  async getCommitmentSummary(id: string, userId: string): Promise<{
    commitment: Commitment;
    total_amount: number;
    installment_amount: number;
    installments_paid: number;
    installments_remaining: number;
    amount_paid: number;
    amount_remaining: number;
    next_installment_date: Date | null;
  }> {
    const commitment = await this.findOne(id, userId);

    const installmentsPaid = commitment.transactions?.length || 0;
    const installmentsRemaining = commitment.installments_count - installmentsPaid;
    const amountPaid = commitment.transactions?.reduce(
      (sum, t) => sum + Number(t.amount),
      0,
    ) || 0;
    const amountRemaining = Number(commitment.total_amount) - amountPaid;

    // Calculate next installment date
    let nextInstallmentDate: Date | null = null;
    if (installmentsRemaining > 0) {
      const firstDate = new Date(commitment.first_installment_date);
      const monthsToAdd = installmentsPaid;
      
      if (commitment.frequency === 'monthly') {
        nextInstallmentDate = new Date(firstDate);
        nextInstallmentDate.setMonth(firstDate.getMonth() + monthsToAdd);
      } else if (commitment.frequency === 'weekly') {
        nextInstallmentDate = new Date(firstDate);
        nextInstallmentDate.setDate(firstDate.getDate() + (monthsToAdd * 7));
      } else if (commitment.frequency === 'annual') {
        nextInstallmentDate = new Date(firstDate);
        nextInstallmentDate.setFullYear(firstDate.getFullYear() + monthsToAdd);
      }
    }

    return {
      commitment,
      total_amount: Number(commitment.total_amount),
      installment_amount: Number(commitment.installment_amount),
      installments_paid: installmentsPaid,
      installments_remaining: installmentsRemaining,
      amount_paid: amountPaid,
      amount_remaining: amountRemaining,
      next_installment_date: nextInstallmentDate,
    };
  }
}
