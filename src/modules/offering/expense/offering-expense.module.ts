import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { OfferingExpense } from '@/modules/offering/expense/entities/offering-expense.entity';
import { OfferingExpenseService } from '@/modules/offering/expense/offering-expense.service';
import { OfferingExpenseController } from '@/modules/offering/expense/offering-expense.controller';

import { OfferingExpenseSearchStrategyFactory } from '@/modules/offering/expense/strategies/offering-expense-search-strategy.factory';
import { OfferingExpenseByDateRangeStrategy } from '@/modules/offering/expense/strategies/options/offering-expense-by-date-range.strategy';
import { OfferingExpenseByAdjustmentStrategy } from '@/modules/offering/expense/strategies/options/offering-expense-by-adjustment.strategy';
import { OfferingExpenseByRecordStatusStrategy } from '@/modules/offering/expense/strategies/options/offering-expense-by-record-status.strategy';

import { AuthModule } from '@/modules/auth/auth.module';
import { ChurchModule } from '@/modules/church/church.module';

@Module({
  controllers: [OfferingExpenseController],
  providers: [
    OfferingExpenseService,
    OfferingExpenseSearchStrategyFactory,
    OfferingExpenseByDateRangeStrategy,
    OfferingExpenseByAdjustmentStrategy,
    OfferingExpenseByRecordStatusStrategy,
  ],
  imports: [
    TypeOrmModule.forFeature([OfferingExpense]),
    forwardRef(() => ChurchModule),
    AuthModule,
  ],
  exports: [TypeOrmModule, OfferingExpenseService],
})
export class OfferingExpenseModule {}
