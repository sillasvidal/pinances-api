import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Commitment } from '../entities/commitment.entity';
import { Card } from '../entities/card.entity';
import { Account } from '../entities/account.entity';
import { CommitmentsController } from './commitments.controller';
import { CommitmentsService } from './commitments.service';

@Module({
  imports: [TypeOrmModule.forFeature([Commitment, Card, Account])],
  controllers: [CommitmentsController],
  providers: [CommitmentsService],
  exports: [CommitmentsService],
})
export class CommitmentsModule {}
