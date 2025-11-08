import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from '@/modules/auth/auth.module';

import { User } from '@/modules/user/entities/user.entity';

import { UserService } from '@/modules/user/user.service';
import { UserController } from '@/modules/user/user.controller';
import { ChurchModule } from '../church/church.module';

@Module({
  controllers: [UserController],
  providers: [UserService],
  imports: [
    TypeOrmModule.forFeature([User]),
    forwardRef(() => AuthModule),
    forwardRef(() => ChurchModule),
  ],
  exports: [TypeOrmModule, UserService],
})
export class UserModule {}
