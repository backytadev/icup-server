import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { OfferingExpense } from '@/modules/offering/expense/entities/offering-expense.entity';
import { OfferingExpenseService } from '@/modules/offering/expense/offering-expense.service';
import { OfferingExpenseController } from '@/modules/offering/expense/offering-expense.controller';

import { AuthModule } from '@/modules/auth/auth.module';
import { ChurchModule } from '@/modules/church/church.module';

@Module({
  controllers: [OfferingExpenseController],
  providers: [OfferingExpenseService],
  imports: [
    TypeOrmModule.forFeature([OfferingExpense]),
    forwardRef(() => ChurchModule),
    AuthModule,
  ],
  exports: [TypeOrmModule, OfferingExpenseService],
})
export class OfferingExpenseModule {}
