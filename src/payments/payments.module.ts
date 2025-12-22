import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentsService } from './payments.service';
import { Payment } from '../entities/payment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Payment])],
  controllers: [], // No controllers for now, mainly internal service or webhook
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
