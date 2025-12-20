import { TypeOrmModule } from '@nestjs/typeorm';
import { Module, forwardRef } from '@nestjs/common';

import { Pastor } from '@/modules/pastor/entities/pastor.entity';
import { PastorService } from '@/modules/pastor/pastor.service';
import { PastorController } from '@/modules/pastor/pastor.controller';

import { CommonModule } from '@/common/common.module';
import { ZoneModule } from '@/modules/zone/zone.module';
import { AuthModule } from '@/modules/auth/auth.module';
import { ChurchModule } from '@/modules/church/church.module';
import { MemberModule } from '@/modules/member/member.module';
import { DiscipleModule } from '@/modules/disciple/disciple.module';
import { CopastorModule } from '@/modules/copastor/copastor.module';
import { PreacherModule } from '@/modules/preacher/preacher.module';
import { MinistryModule } from '@/modules/ministry/ministry.module';
import { SupervisorModule } from '@/modules/supervisor/supervisor.module';
import { FamilyGroupModule } from '@/modules/family-group/family-group.module';
import { OfferingIncomeModule } from '@/modules/offering/income/offering-income.module';

@Module({
  controllers: [PastorController],
  providers: [PastorService],
  imports: [
    TypeOrmModule.forFeature([Pastor]),
    AuthModule,
    MemberModule,
    MinistryModule,
    CommonModule,
    forwardRef(() => ChurchModule),
    forwardRef(() => CopastorModule),
    forwardRef(() => SupervisorModule),
    forwardRef(() => ZoneModule),
    forwardRef(() => PreacherModule),
    forwardRef(() => FamilyGroupModule),
    forwardRef(() => DiscipleModule),
    forwardRef(() => OfferingIncomeModule),
  ],
  exports: [TypeOrmModule, PastorService],
})
export class PastorModule {}
