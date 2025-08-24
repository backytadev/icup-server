import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SuperUserService } from '@/utils/create-super-user';

import { CommonModule } from '@/common/common.module';
import { SeedModule } from '@/modules/seed/seed.module';
import { AuthModule } from '@/modules/auth/auth.module';
import { ZoneModule } from '@/modules/zone/zone.module';
import { UserModule } from '@/modules/user/user.module';
import { FilesModule } from '@/modules/files/files.module';
import { ChurchModule } from '@/modules/church/church.module';
import { PastorModule } from '@/modules/pastor/pastor.module';
import { MemberModule } from '@/modules/member/member.module';
import { MetricsModule } from '@/modules/metrics/metrics.module';
import { ReportsModule } from '@/modules/reports/reports.module';
import { PrinterModule } from '@/modules/printer/printer.module';
import { DiscipleModule } from '@/modules/disciple/disciple.module';
import { PreacherModule } from '@/modules/preacher/preacher.module';
import { MinistryModule } from './modules/ministry/ministry.module';
import { CopastorModule } from '@/modules/copastor/copastor.module';
import { SupervisorModule } from '@/modules/supervisor/supervisor.module';
import { CloudinaryModule } from '@/modules/cloudinary/cloudinary.module';
import { FamilyGroupModule } from '@/modules/family-group/family-group.module';
import { ExternalDonorModule } from '@/modules/external-donor/external-donor.module';
import { OfferingIncomeModule } from '@/modules/offering/income/offering-income.module';
import { OfferingExpenseModule } from '@/modules/offering/expense/offering-expense.module';

@Module({
  imports: [
    ConfigModule.forRoot(), // Access to environment variables global in all modules
    TypeOrmModule.forRoot({
      ssl: process.env.STAGE === 'prod',
      extra: {
        ssl:
          process.env.STAGE === 'prod' ? { rejectUnauthorized: false } : null,
      },
      type: 'postgres',
      host: process.env.DB_HOST,
      port: +process.env.DB_PORT,
      database: process.env.DB_NAME,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      entities: ['dist/modules/**/entities/*.js'],
      migrations: ['dist/database/migrations/*.js'],
      migrationsRun: true,
      migrationsTableName: 'migrations',
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 10,
      },
    ]),
    SeedModule,
    AuthModule,
    UserModule,
    ZoneModule,
    FilesModule,
    ChurchModule,
    PastorModule,
    CommonModule,
    MemberModule,
    ReportsModule,
    MetricsModule,
    CopastorModule,
    PrinterModule,
    PreacherModule,
    MinistryModule,
    DiscipleModule,
    CloudinaryModule,
    SupervisorModule,
    FamilyGroupModule,
    ExternalDonorModule,
    OfferingIncomeModule,
    OfferingExpenseModule,
  ],
  providers: [
    SuperUserService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
