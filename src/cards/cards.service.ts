import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Card } from '../entities/card.entity';
import { CreateCardDto } from './dto/create-card.dto';
import { UpdateCardDto } from './dto/update-card.dto';

@Injectable()
export class CardsService {
  constructor(
    @InjectRepository(Card)
    private readonly cardRepository: Repository<Card>,
  ) {}

  async create(createCardDto: CreateCardDto, userId: string): Promise<Card> {
    const card = this.cardRepository.create({
      ...createCardDto,
      user_id: userId,
    });
    return await this.cardRepository.save(card);
  }

  async findAll(userId: string): Promise<Card[]> {
    return await this.cardRepository.find({
      where: { user_id: userId, active: true },
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: string, userId: string): Promise<Card> {
    const card = await this.cardRepository.findOne({
      where: { id, user_id: userId },
    });

    if (!card) {
      throw new NotFoundException(`Card with ID ${id} not found`);
    }

    return card;
  }

  async update(
    id: string,
    updateCardDto: UpdateCardDto,
    userId: string,
  ): Promise<Card> {
    const card = await this.findOne(id, userId);
    Object.assign(card, updateCardDto);
    return await this.cardRepository.save(card);
  }

  async remove(id: string, userId: string): Promise<void> {
    const card = await this.findOne(id, userId);
    card.active = false;
    await this.cardRepository.save(card);
  }

  async getCardSummary(id: string, userId: string): Promise<{
    card: Card;
    total_limit: number;
    available_limit: number;
    current_usage: number;
  }> {
    const card = await this.findOne(id, userId);

    // TODO: Calculate current usage from invoices when Invoice module is implemented
    const current_usage = 0;
    const available_limit = Number(card.total_limit || 0) - current_usage;

    return {
      card,
      total_limit: Number(card.total_limit || 0),
      available_limit,
      current_usage,
    };
  }
}
