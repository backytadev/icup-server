import { TypeOrmModule } from '@nestjs/typeorm';
import { Module, forwardRef } from '@nestjs/common';

import { FamilyGroup } from '@/modules/family-group/entities/family-group.entity';

import { FamilyGroupService } from '@/modules/family-group/family-group.service';
import { FamilyGroupController } from '@/modules/family-group/family-group.controller';

import { AuthModule } from '@/modules/auth/auth.module';
import { ZoneModule } from '@/modules/zone/zone.module';
import { PastorModule } from '@/modules/pastor/pastor.module';
import { ChurchModule } from '@/modules/church/church.module';
import { CopastorModule } from '@/modules/copastor/copastor.module';
import { PreacherModule } from '@/modules/preacher/preacher.module';
import { DiscipleModule } from '@/modules/disciple/disciple.module';
import { SupervisorModule } from '@/modules/supervisor/supervisor.module';
import { CommonModule } from '@/common/common.module';

@Module({
  controllers: [FamilyGroupController],
  providers: [FamilyGroupService],
  imports: [
    TypeOrmModule.forFeature([FamilyGroup]),
    AuthModule,
    CommonModule,
    forwardRef(() => ChurchModule),
    forwardRef(() => PastorModule),
    forwardRef(() => CopastorModule),
    forwardRef(() => SupervisorModule),
    forwardRef(() => ZoneModule),
    forwardRef(() => PreacherModule),
    forwardRef(() => DiscipleModule),
  ],
  exports: [TypeOrmModule, FamilyGroupService],
})
export class FamilyGroupModule {}
