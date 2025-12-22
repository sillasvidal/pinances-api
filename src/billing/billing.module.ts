import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BillingService } from './billing.service';
import { BillingController } from './billing.controller';
import { BillingInvoice } from '../entities/billing-invoice.entity';

@Module({
  imports: [TypeOrmModule.forFeature([BillingInvoice])],
  controllers: [BillingController],
  providers: [BillingService],
  exports: [BillingService],
})
export class BillingModule {}
