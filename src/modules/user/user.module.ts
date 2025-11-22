import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from '@/modules/auth/auth.module';

import { User } from '@/modules/user/entities/user.entity';
import { ChurchModule } from '@/modules/church/church.module';
import { MinistryModule } from '@/modules/ministry/ministry.module';

import { UserService } from '@/modules/user/user.service';
import { UserController } from '@/modules/user/user.controller';

@Module({
  controllers: [UserController],
  providers: [UserService],
  imports: [
    TypeOrmModule.forFeature([User]),
    forwardRef(() => AuthModule),
    forwardRef(() => MinistryModule),
    forwardRef(() => ChurchModule),
  ],
  exports: [TypeOrmModule, UserService],
})
export class UserModule {}
