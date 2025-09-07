import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Copastor } from '@/modules/copastor/entities/copastor.entity';

import { CopastorService } from '@/modules/copastor/copastor.service';
import { CopastorController } from '@/modules/copastor/copastor.controller';

import { ZoneModule } from '@/modules/zone/zone.module';
import { AuthModule } from '@/modules/auth/auth.module';
import { PastorModule } from '@/modules/pastor/pastor.module';
import { ChurchModule } from '@/modules/church/church.module';
import { MemberModule } from '@/modules/member/member.module';
import { PreacherModule } from '@/modules/preacher/preacher.module';
import { MinistryModule } from '@/modules/ministry/ministry.module';
import { DiscipleModule } from '@/modules/disciple/disciple.module';
import { SupervisorModule } from '@/modules/supervisor/supervisor.module';
import { FamilyGroupModule } from '@/modules/family-group/family-group.module';
import { OfferingIncomeModule } from '@/modules/offering/income/offering-income.module';

@Module({
  controllers: [CopastorController],
  providers: [CopastorService],
  imports: [
    TypeOrmModule.forFeature([Copastor]),
    forwardRef(() => ChurchModule),
    forwardRef(() => PastorModule),
    forwardRef(() => SupervisorModule),
    forwardRef(() => ZoneModule),
    forwardRef(() => PreacherModule),
    forwardRef(() => FamilyGroupModule),
    forwardRef(() => DiscipleModule),
    forwardRef(() => OfferingIncomeModule),
    MemberModule,
    MinistryModule,
    AuthModule,
  ],
  exports: [TypeOrmModule, CopastorService],
})
export class CopastorModule {}
