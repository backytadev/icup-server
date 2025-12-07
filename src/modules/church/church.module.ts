import { TypeOrmModule } from '@nestjs/typeorm';
import { Module, forwardRef } from '@nestjs/common';

import { AuthModule } from '@/modules/auth/auth.module';

import { ChurchService } from '@/modules/church/church.service';
import { Church } from '@/modules/church/entities/church.entity';
import { ChurchController } from '@/modules/church/church.controller';

import { ZoneModule } from '@/modules/zone/zone.module';
import { UserModule } from '@/modules/user/user.module';
import { PastorModule } from '@/modules/pastor/pastor.module';
import { PreacherModule } from '@/modules/preacher/preacher.module';
import { CopastorModule } from '@/modules/copastor/copastor.module';
import { DiscipleModule } from '@/modules/disciple/disciple.module';
import { MinistryModule } from '@/modules/ministry/ministry.module';
import { SupervisorModule } from '@/modules/supervisor/supervisor.module';
import { FamilyGroupModule } from '@/modules/family-group/family-group.module';

import { ChurchSearchStrategyFactory } from '@/modules/church/search/church-search-strategy.factory';

import { AddressSearchStrategy } from '@/modules/church/search/strategies/address-search.strategy';
import { DistrictSearchStrategy } from '@/modules/church/search/strategies/district-search.strategy';
import { ProvinceSearchStrategy } from '@/modules/church/search/strategies/province-search.strategy';
import { DepartmentSearchStrategy } from '@/modules/church/search/strategies/department-search.strategy';
import { ChurchNameSearchStrategy } from '@/modules/church/search/strategies/church-name-search.strategy';
import { UrbanSectorSearchStrategy } from '@/modules/church/search/strategies/urban-sector-search.strategy';
import { RecordStatusSearchStrategy } from '@/modules/church/search/strategies/record-status-search.strategy';
import { FoundingDateSearchStrategy } from '@/modules/church/search/strategies/founding-date-search.strategy';

@Module({
  controllers: [ChurchController],
  providers: [
    ChurchService,
    ChurchNameSearchStrategy,
    FoundingDateSearchStrategy,
    DepartmentSearchStrategy,
    ProvinceSearchStrategy,
    DistrictSearchStrategy,
    UrbanSectorSearchStrategy,
    AddressSearchStrategy,
    RecordStatusSearchStrategy,
    ChurchSearchStrategyFactory,
  ],
  imports: [
    TypeOrmModule.forFeature([Church]),
    AuthModule,
    MinistryModule,
    forwardRef(() => UserModule),
    forwardRef(() => PastorModule),
    forwardRef(() => CopastorModule),
    forwardRef(() => SupervisorModule),
    forwardRef(() => PreacherModule),
    forwardRef(() => FamilyGroupModule),
    forwardRef(() => ZoneModule),
    forwardRef(() => DiscipleModule),
  ],
  exports: [TypeOrmModule, ChurchService],
})
export class ChurchModule {}
