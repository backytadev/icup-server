import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from '@/modules/auth/auth.module';

import { Preacher } from '@/modules/preacher/entities/preacher.entity';

import { PreacherService } from '@/modules/preacher/preacher.service';
import { PreacherController } from '@/modules/preacher/preacher.controller';

import { ZoneModule } from '@/modules/zone/zone.module';
import { PastorModule } from '@/modules/pastor/pastor.module';
import { ChurchModule } from '@/modules/church/church.module';
import { MemberModule } from '@/modules/member/member.module';
import { DiscipleModule } from '@/modules/disciple/disciple.module';
import { CopastorModule } from '@/modules/copastor/copastor.module';
import { MinistryModule } from '@/modules/ministry/ministry.module';
import { SupervisorModule } from '@/modules/supervisor/supervisor.module';
import { FamilyGroupModule } from '@/modules/family-group/family-group.module';
import { OfferingIncomeModule } from '@/modules/offering/income/offering-income.module';

@Module({
  controllers: [PreacherController],
  providers: [PreacherService],
  imports: [
    TypeOrmModule.forFeature([Preacher]),
    forwardRef(() => ChurchModule),
    forwardRef(() => PastorModule),
    forwardRef(() => CopastorModule),
    forwardRef(() => SupervisorModule),
    forwardRef(() => ZoneModule),
    forwardRef(() => FamilyGroupModule),
    forwardRef(() => DiscipleModule),
    forwardRef(() => OfferingIncomeModule),
    MemberModule,
    MinistryModule,
    AuthModule,
  ],
  exports: [TypeOrmModule, PreacherService],
})
export class PreacherModule {}
