import { forwardRef, Module } from '@nestjs/common';

import { MetricsService } from '@/modules/metrics/metrics.service';
import { MetricsController } from '@/modules/metrics/metrics.controller';

import { DashboardMetricsService } from '@/modules/metrics/services/dashboard-metrics.service';
import { MemberMetricsService } from '@/modules/metrics/services/member-metrics.service';
import { FamilyGroupMetricsService } from '@/modules/metrics/services/family-group-metrics.service';
import { OfferingIncomeMetricsService } from '@/modules/metrics/services/offering-income-metrics.service';
import { OfferingExpenseMetricsService } from '@/modules/metrics/services/offering-expense-metrics.service';
import { OfferingComparativeMetricsService } from '@/modules/metrics/services/offering-comparative-metrics.service';

import { AuthModule } from '@/modules/auth/auth.module';

import { ZoneModule } from '@/modules/zone/zone.module';
import { ChurchModule } from '@/modules/church/church.module';
import { PastorModule } from '@/modules/pastor/pastor.module';
import { CopastorModule } from '@/modules/copastor/copastor.module';
import { DiscipleModule } from '@/modules/disciple/disciple.module';
import { PreacherModule } from '@/modules/preacher/preacher.module';
import { SupervisorModule } from '@/modules/supervisor/supervisor.module';
import { FamilyGroupModule } from '@/modules/family-group/family-group.module';
import { OfferingIncomeModule } from '@/modules/offering/income/offering-income.module';
import { OfferingExpenseModule } from '@/modules/offering/expense/offering-expense.module';

@Module({
  providers: [
    MetricsService,
    DashboardMetricsService,
    MemberMetricsService,
    FamilyGroupMetricsService,
    OfferingIncomeMetricsService,
    OfferingExpenseMetricsService,
    OfferingComparativeMetricsService,
  ],
  controllers: [MetricsController],
  imports: [
    AuthModule,
    FamilyGroupModule,
    OfferingExpenseModule,
    forwardRef(() => ZoneModule),
    forwardRef(() => ChurchModule),
    forwardRef(() => PastorModule),
    forwardRef(() => CopastorModule),
    forwardRef(() => DiscipleModule),
    forwardRef(() => PreacherModule),
    forwardRef(() => SupervisorModule),
    forwardRef(() => OfferingIncomeModule),
  ],
  exports: [
    MetricsService,
    DashboardMetricsService,
    MemberMetricsService,
    FamilyGroupMetricsService,
    OfferingIncomeMetricsService,
    OfferingExpenseMetricsService,
    OfferingComparativeMetricsService,
  ],
})
export class MetricsModule {}
