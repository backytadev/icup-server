import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { MinistryService } from '@/modules/ministry/ministry.service';
import { Ministry } from '@/modules/ministry/entities/ministry.entity';
import { MinistryController } from '@/modules/ministry/ministry.controller';

import { AuthModule } from '@/modules/auth/auth.module';
import { UserModule } from '@/modules/user/user.module';
import { ChurchModule } from '@/modules/church/church.module';
import { PastorModule } from '@/modules/pastor/pastor.module';
import { MinistryMember } from '@/modules/ministry/entities/ministry-member.entity';

@Module({
  controllers: [MinistryController],
  providers: [MinistryService],
  imports: [
    TypeOrmModule.forFeature([Ministry, MinistryMember]),
    forwardRef(() => ChurchModule),
    forwardRef(() => PastorModule),
    forwardRef(() => UserModule),
    AuthModule,
  ],
  exports: [TypeOrmModule, MinistryService],
})
export class MinistryModule {}
