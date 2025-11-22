import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { SeedService } from '@/modules/seed/seed.service';
import { SeedController } from '@/modules/seed/seed.controller';

import { UserModule } from '@/modules/user/user.module';
import { AuthModule } from '@/modules/auth/auth.module';
import { ZoneModule } from '@/modules/zone/zone.module';
import { PastorModule } from '@/modules/pastor/pastor.module';
import { ChurchModule } from '@/modules/church/church.module';
import { MemberModule } from '@/modules/member/member.module';
import { PreacherModule } from '@/modules/preacher/preacher.module';
import { DiscipleModule } from '@/modules/disciple/disciple.module';
import { CopastorModule } from '@/modules/copastor/copastor.module';
import { MinistryModule } from '@/modules/ministry/ministry.module';
import { SupervisorModule } from '@/modules/supervisor/supervisor.module';
import { FamilyGroupModule } from '@/modules/family-group/family-group.module';
import { ExternalDonorModule } from '@/modules/external-donor/external-donor.module';
import { OfferingIncomeModule } from '@/modules/offering/income/offering-income.module';
import { OfferingExpenseModule } from '@/modules/offering/expense/offering-expense.module';

@Module({
  controllers: [SeedController],
  providers: [SeedService],
  imports: [
    ChurchModule,
    MinistryModule,
    PastorModule,
    CopastorModule,
    SupervisorModule,
    ZoneModule,
    PreacherModule,
    FamilyGroupModule,
    DiscipleModule,
    MemberModule,
    AuthModule,
    UserModule,
    ExternalDonorModule,
    OfferingIncomeModule,
    OfferingExpenseModule,
    ConfigModule,
  ],
})
export class SeedModule {}
