import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Account } from '../entities/account.entity';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';

@Injectable()
export class AccountsService {
  constructor(
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,
  ) {}

  async create(createAccountDto: CreateAccountDto, userId: string): Promise<Account> {
    const account = this.accountRepository.create({
      ...createAccountDto,
      user_id: userId,
    });
    return await this.accountRepository.save(account);
  }

  async findAll(userId: string): Promise<Account[]> {
    return await this.accountRepository.find({
      where: { active: true, user_id: userId },
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: string, userId: string): Promise<Account> {
    const account = await this.accountRepository.findOne({
      where: { id, user_id: userId },
    });
    if (!account) {
      throw new NotFoundException(`Account with ID ${id} not found`);
    }
    return account;
  }

  async update(
    id: string,
    updateAccountDto: UpdateAccountDto,
    userId: string,
  ): Promise<Account> {
    const account = await this.findOne(id, userId);
    Object.assign(account, updateAccountDto);
    return await this.accountRepository.save(account);
  }

  async remove(id: string, userId: string): Promise<void> {
    const account = await this.findOne(id, userId);
    account.active = false;
    await this.accountRepository.save(account);
  }

  async getBalance(id: string, userId: string): Promise<{
    current_balance: number;
    commitment_reserve: number;
    available_balance: number;
  }> {
    const account = await this.findOne(id, userId);
    const available =
      Number(account.current_balance) -
      Number(account.commitment_reserve || 0);

    return {
      current_balance: Number(account.current_balance),
      commitment_reserve: Number(account.commitment_reserve || 0),
      available_balance: available,
    };
  }
}
