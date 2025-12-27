import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(email: string, name: string, password: string): Promise<User> {
    // Check if user already exists
    const existingUser = await this.userRepository.findOne({ where: { email } });
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = this.userRepository.create({
      email,
      name,
      password: hashedPassword,
    });

    return await this.userRepository.save(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.userRepository.findOne({
      where: { email },
      select: ['id', 'email', 'name', 'password', 'active', 'created_at', 'updated_at'],
    });
  }

  async findById(id: string): Promise<User | null> {
    return await this.userRepository.findOne({
      where: { id, active: true },
      select: ['id', 'email', 'name', 'active', 'tutorial_completed', 'tutorial_step', 'created_at', 'updated_at'],
    });
  }

  async validatePassword(password: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword);
  }

  async updateTutorialStep(userId: string, step: number): Promise<User> {
    await this.userRepository.update(userId, { tutorial_step: step });
    const user = await this.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async completeTutorial(userId: string): Promise<User> {
    await this.userRepository.update(userId, {
      tutorial_completed: true,
      tutorial_step: 6,
    });
    const user = await this.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async skipTutorial(userId: string): Promise<User> {
    await this.userRepository.update(userId, {
      tutorial_step: -1,
    });
    const user = await this.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async restartTutorial(userId: string): Promise<User> {
    await this.userRepository.update(userId, {
      tutorial_completed: false,
      tutorial_step: 0,
    });
    const user = await this.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }
}
