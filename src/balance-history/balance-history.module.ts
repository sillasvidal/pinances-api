import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BalanceHistory } from '../entities/balance-history.entity';
import { Account } from '../entities/account.entity';
import { BalanceHistoryService } from './balance-history.service';
import { BalanceHistoryController } from './balance-history.controller';

@Module({
    imports: [TypeOrmModule.forFeature([BalanceHistory, Account])],
    controllers: [BalanceHistoryController],
    providers: [BalanceHistoryService],
    exports: [BalanceHistoryService],
})
export class BalanceHistoryModule { }
