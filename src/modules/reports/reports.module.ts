import { forwardRef, Module } from '@nestjs/common';

import { ReportsService } from '@/modules/reports/reports.service';
import { ReportsController } from '@/modules/reports/reports.controller';

import { ZoneModule } from '@/modules/zone/zone.module';
import { ChurchModule } from '@/modules/church/church.module';
import { PastorModule } from '@/modules/pastor/pastor.module';
import { MemberModule } from '@/modules/member/member.module';
import { DiscipleModule } from '@/modules/disciple/disciple.module';
import { CopastorModule } from '@/modules/copastor/copastor.module';
import { PreacherModule } from '@/modules/preacher/preacher.module';
import { SupervisorModule } from '@/modules/supervisor/supervisor.module';
import { FamilyGroupModule } from '@/modules/family-group/family-group.module';

import { PrinterModule } from '@/modules/printer/printer.module';
import { MetricsModule } from '@/modules/metrics/metrics.module';

import { AuthModule } from '@/modules/auth/auth.module';
import { UserModule } from '@/modules/user/user.module';
import { OfferingIncomeModule } from '@/modules/offering/income/offering-income.module';
import { OfferingExpenseModule } from '@/modules/offering/expense/offering-expense.module';

@Module({
  controllers: [ReportsController],
  providers: [ReportsService],
  imports: [
    AuthModule,
    UserModule,
    MemberModule,
    PrinterModule,
    MetricsModule,
    FamilyGroupModule,
    OfferingExpenseModule,
    forwardRef(() => ZoneModule),
    forwardRef(() => ChurchModule),
    forwardRef(() => PastorModule),
    forwardRef(() => CopastorModule),
    forwardRef(() => PreacherModule),
    forwardRef(() => DiscipleModule),
    forwardRef(() => SupervisorModule),
    forwardRef(() => OfferingIncomeModule),
  ],
  exports: [ReportsService],
})
export class ReportsModule {}
