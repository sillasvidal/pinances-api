import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

const DEFAULT_CATEGORIES = [
  { name: 'Salário', icon: '💰', color: '#10b981', type: 'income' as const, is_default: true },
  { name: 'Alimentação', icon: '🍔', color: '#f59e0b', type: 'expense' as const, is_default: true },
  { name: 'Transporte', icon: '🚗', color: '#3b82f6', type: 'expense' as const, is_default: true },
  { name: 'Saúde', icon: '🏥', color: '#ef4444', type: 'expense' as const, is_default: true },
  { name: 'Educação', icon: '📚', color: '#8b5cf6', type: 'expense' as const, is_default: true },
  { name: 'Lazer', icon: '🎮', color: '#ec4899', type: 'expense' as const, is_default: true },
  { name: 'Compras', icon: '🛍️', color: '#f97316', type: 'expense' as const, is_default: true },
  { name: 'Moradia', icon: '🏠', color: '#14b8a6', type: 'expense' as const, is_default: true },
  { name: 'Contas', icon: '📱', color: '#6366f1', type: 'expense' as const, is_default: true },
  { name: 'Investimentos', icon: '💼', color: '#059669', type: 'income' as const, is_default: true },
  { name: 'Outros', icon: '📦', color: '#6b7280', type: 'both' as const, is_default: true },
];

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  async createDefaultCategories(userId: string): Promise<Category[]> {
    const categories = DEFAULT_CATEGORIES.map((cat) =>
      this.categoryRepository.create({
        ...cat,
        user_id: userId,
      }),
    );

    return await this.categoryRepository.save(categories);
  }

  async create(
    createCategoryDto: CreateCategoryDto,
    userId: string,
  ): Promise<Category> {
    const category = this.categoryRepository.create({
      ...createCategoryDto,
      user_id: userId,
      is_default: false,
    });

    return await this.categoryRepository.save(category);
  }

  async findAll(userId: string): Promise<Category[]> {
    return await this.categoryRepository.find({
      where: { user_id: userId, archived: false },
      order: { is_default: 'DESC', name: 'ASC' },
    });
  }

  async findOne(id: string, userId: string): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      where: { id, user_id: userId, archived: false },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    return category;
  }

  async update(
    id: string,
    updateCategoryDto: UpdateCategoryDto,
    userId: string,
  ): Promise<Category> {
    const category = await this.findOne(id, userId);

    if (category.is_default) {
      throw new BadRequestException('Cannot modify default categories');
    }

    Object.assign(category, updateCategoryDto);
    return await this.categoryRepository.save(category);
  }

  async remove(id: string, userId: string): Promise<void> {
    const category = await this.findOne(id, userId);

    if (category.is_default) {
      throw new UnprocessableEntityException('Cannot delete default categories');
    }

    category.archived = true;
    await this.categoryRepository.save(category);
  }
}
