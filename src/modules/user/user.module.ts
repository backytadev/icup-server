import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from '@/modules/auth/auth.module';

import { User } from '@/modules/user/entities/user.entity';
import { ChurchModule } from '@/modules/church/church.module';
import { MinistryModule } from '@/modules/ministry/ministry.module';

import { UserService } from '@/modules/user/user.service';
import { UserController } from '@/modules/user/user.controller';

import { UserSearchStrategyFactory } from '@/modules/user/search/user-search-strategy.factory';
import { RolesSearchStrategy } from '@/modules/user/search/strategies/roles-search.strategy';
import { GenderSearchStrategy } from '@/modules/user/search/strategies/gender-search.strategy';
import { FullNameSearchStrategy } from '@/modules/user/search/strategies/full-name-search.strategy';
import { LastNamesSearchStrategy } from '@/modules/user/search/strategies/last-names-search.strategy';
import { FirstNamesSearchStrategy } from '@/modules/user/search/strategies/first-names-search.strategy';
import { RecordStatusSearchStrategy } from '@/modules/user/search/strategies/record-status-search.strategy';

@Module({
  controllers: [UserController],
  providers: [
    UserService,
    RolesSearchStrategy,
    GenderSearchStrategy,
    FullNameSearchStrategy,
    LastNamesSearchStrategy,
    FirstNamesSearchStrategy,
    RecordStatusSearchStrategy,
    UserSearchStrategyFactory,
  ],
  imports: [
    TypeOrmModule.forFeature([User]),
    forwardRef(() => AuthModule),
    forwardRef(() => MinistryModule),
    forwardRef(() => ChurchModule),
  ],
  exports: [TypeOrmModule, UserService],
})
export class UserModule {}
