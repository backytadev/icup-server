import { forwardRef, Module } from '@nestjs/common';

import { CloudinaryService } from '@/modules/cloudinary/cloudinary.service';
import { CloudinaryProvider } from '@/modules/cloudinary/providers/cloudinary.provider';

import { OfferingIncomeModule } from '@/modules/offering/income/offering-income.module';
import { OfferingExpenseModule } from '@/modules/offering/expense/offering-expense.module';
import { CalendarEventsModule } from '../calendar-events/calendar-events.module';

@Module({
  providers: [CloudinaryProvider, CloudinaryService],
  imports: [
    forwardRef(() => OfferingIncomeModule),
    forwardRef(() => OfferingExpenseModule),
    forwardRef(() => CalendarEventsModule),
  ],
  exports: [CloudinaryProvider, CloudinaryService],
})
export class CloudinaryModule {}
