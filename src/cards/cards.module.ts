import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Card } from '../entities/card.entity';
import { CardsController } from './cards.controller';
import { CardsService } from './cards.service';

@Module({
  imports: [TypeOrmModule.forFeature([Card])],
  controllers: [CardsController],
  providers: [CardsService],
  exports: [CardsService],
})
export class CardsModule {}
