import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Zone } from '@/modules/zone/entities/zone.entity';
import { ZoneService } from '@/modules/zone/zone.service';
import { ZoneController } from '@/modules/zone/zone.controller';

import { CommonModule } from '@/common/common.module';
import { AuthModule } from '@/modules/auth/auth.module';
import { ChurchModule } from '@/modules/church/church.module';
import { PastorModule } from '@/modules/pastor/pastor.module';
import { PreacherModule } from '@/modules/preacher/preacher.module';
import { CopastorModule } from '@/modules/copastor/copastor.module';
import { DiscipleModule } from '@/modules/disciple/disciple.module';
import { SupervisorModule } from '@/modules/supervisor/supervisor.module';
import { FamilyGroupModule } from '@/modules/family-group/family-group.module';

@Module({
  controllers: [ZoneController],
  providers: [ZoneService],
  imports: [
    TypeOrmModule.forFeature([Zone]),
    AuthModule,
    CommonModule,
    forwardRef(() => ChurchModule),
    forwardRef(() => PastorModule),
    forwardRef(() => CopastorModule),
    forwardRef(() => SupervisorModule),
    forwardRef(() => PreacherModule),
    forwardRef(() => FamilyGroupModule),
    forwardRef(() => DiscipleModule),
  ],
  exports: [TypeOrmModule, ZoneService],
})
export class ZoneModule {}
