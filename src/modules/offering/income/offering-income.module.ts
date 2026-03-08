import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { OfferingIncome } from '@/modules/offering/income/entities/offering-income.entity';
import { OfferingIncomeService } from '@/modules/offering/income/offering-income.service';
import { OfferingIncomeController } from '@/modules/offering/income/offering-income.controller';

import { OfferingIncomeCreateService } from '@/modules/offering/income/services/offering-income-create.service';
import { OfferingIncomeUpdateService } from '@/modules/offering/income/services/offering-income-update.service';
import { OfferingIncomeRemoveService } from '@/modules/offering/income/services/offering-income-remove.service';
import { OfferingIncomeReadService } from '@/modules/offering/income/services/offering-income-read.service';

import { ZoneModule } from '@/modules/zone/zone.module';
import { AuthModule } from '@/modules/auth/auth.module';
import { ChurchModule } from '@/modules/church/church.module';
import { PastorModule } from '@/modules/pastor/pastor.module';
import { ReportsModule } from '@/modules/reports/reports.module';
import { PreacherModule } from '@/modules/preacher/preacher.module';
import { DiscipleModule } from '@/modules/disciple/disciple.module';
import { CopastorModule } from '@/modules/copastor/copastor.module';
import { SupervisorModule } from '@/modules/supervisor/supervisor.module';
import { FamilyGroupModule } from '@/modules/family-group/family-group.module';
import { ExternalDonorModule } from '@/modules/external-donor/external-donor.module';
import { CloudinaryModule } from '@/modules/cloudinary/cloudinary.module';

import { OfferingIncomeSearchStrategyFactory } from '@/modules/offering/income/strategies/offering-income-search-strategy.factory';
import { OfferingIncomeByDateStrategy } from '@/modules/offering/income/strategies/options/offering-income-by-date.strategy';
import { OfferingIncomeByShiftStrategy } from '@/modules/offering/income/strategies/options/offering-income-by-shift.strategy';
import { OfferingIncomeByShiftDateStrategy } from '@/modules/offering/income/strategies/options/offering-income-by-shift-date.strategy';
import { OfferingIncomeByRecordStatusStrategy } from '@/modules/offering/income/strategies/options/offering-income-by-record-status.strategy';
import { OfferingIncomeByZoneStrategy } from '@/modules/offering/income/strategies/options/offering-income-by-zone.strategy';
import { OfferingIncomeByZoneDateStrategy } from '@/modules/offering/income/strategies/options/offering-income-by-zone-date.strategy';
import { OfferingIncomeByGroupCodeStrategy } from '@/modules/offering/income/strategies/options/offering-income-by-group-code.strategy';
import { OfferingIncomeByGroupCodeDateStrategy } from '@/modules/offering/income/strategies/options/offering-income-by-group-code-date.strategy';
import { OfferingIncomeByPreacherFirstNamesStrategy } from '@/modules/offering/income/strategies/options/offering-income-by-preacher-first-names.strategy';
import { OfferingIncomeByPreacherLastNamesStrategy } from '@/modules/offering/income/strategies/options/offering-income-by-preacher-last-names.strategy';
import { OfferingIncomeByPreacherFullNamesStrategy } from '@/modules/offering/income/strategies/options/offering-income-by-preacher-full-names.strategy';
import { OfferingIncomeByZoneSupervisorFirstNamesStrategy } from '@/modules/offering/income/strategies/options/offering-income-by-supervisor-first-names.strategy';
import { OfferingIncomeByZoneSupervisorLastNamesStrategy } from '@/modules/offering/income/strategies/options/offering-income-by-supervisor-last-names.strategy';
import { OfferingIncomeByZoneSupervisorFullNamesStrategy } from '@/modules/offering/income/strategies/options/offering-income-by-supervisor-full-names.strategy';
import { OfferingIncomeByContributorFirstNamesStrategy } from '@/modules/offering/income/strategies/options/offering-income-by-contributor-first-names.strategy';
import { OfferingIncomeByContributorLastNamesStrategy } from '@/modules/offering/income/strategies/options/offering-income-by-contributor-last-names.strategy';
import { OfferingIncomeByContributorFullNamesStrategy } from '@/modules/offering/income/strategies/options/offering-income-by-contributor-full-names.strategy';

@Module({
  controllers: [OfferingIncomeController],
  providers: [
    OfferingIncomeService,
    OfferingIncomeCreateService,
    OfferingIncomeUpdateService,
    OfferingIncomeRemoveService,
    OfferingIncomeReadService,
    OfferingIncomeSearchStrategyFactory,
    OfferingIncomeByDateStrategy,
    OfferingIncomeByShiftStrategy,
    OfferingIncomeByShiftDateStrategy,
    OfferingIncomeByRecordStatusStrategy,
    OfferingIncomeByZoneStrategy,
    OfferingIncomeByZoneDateStrategy,
    OfferingIncomeByGroupCodeStrategy,
    OfferingIncomeByGroupCodeDateStrategy,
    OfferingIncomeByPreacherFirstNamesStrategy,
    OfferingIncomeByPreacherLastNamesStrategy,
    OfferingIncomeByPreacherFullNamesStrategy,
    OfferingIncomeByZoneSupervisorFirstNamesStrategy,
    OfferingIncomeByZoneSupervisorLastNamesStrategy,
    OfferingIncomeByZoneSupervisorFullNamesStrategy,
    OfferingIncomeByContributorFirstNamesStrategy,
    OfferingIncomeByContributorLastNamesStrategy,
    OfferingIncomeByContributorFullNamesStrategy,
  ],
  imports: [
    TypeOrmModule.forFeature([OfferingIncome]),
    forwardRef(() => ZoneModule),
    forwardRef(() => ReportsModule),
    forwardRef(() => CloudinaryModule),
    forwardRef(() => ChurchModule),
    forwardRef(() => PastorModule),
    forwardRef(() => PreacherModule),
    forwardRef(() => DiscipleModule),
    forwardRef(() => CopastorModule),
    forwardRef(() => SupervisorModule),
    forwardRef(() => FamilyGroupModule),
    AuthModule,
    ExternalDonorModule,
  ],
  exports: [TypeOrmModule, OfferingIncomeService],
})
export class OfferingIncomeModule {}
