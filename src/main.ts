import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from '@/app.module';
import { SuperUserService } from '@/utils/create-super-user';

import { ThrottlerExceptionFilter } from '@/common/filters/throttler-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  app.setGlobalPrefix('api');

  app.use(helmet());

  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.enableCors({
    origin:
      process.env.STAGE === 'prod'
        ? process.env.URL_DOMAIN
        : 'http://localhost:5173',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  app.useGlobalFilters(new ThrottlerExceptionFilter());

  // Config SuperUser
  const superUserService = app.get(SuperUserService);
  await superUserService.createSuperUser();

  // Config Documentation
  if (process.env.STAGE === 'dev') {
    const config = new DocumentBuilder()
      .setTitle('ICUP Restful API')
      .setDescription('ICUP Sever Endpoints')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document, {
      swaggerOptions: {
        tagsSorter: (tagA: string, tagB: string) => {
          const order = [
            'Churches',
            'Pastors',
            'Co-Pastors',
            'Supervisors',
            'Zones',
            'Preachers',
            'Family Groups',
            'Disciples',
            'Offering Income',
            'Offering Expenses',
            'Metrics',
            'Users',
            'External Donors',
            'Reports',
            'Auth',
            'Files',
            'Seed',
          ];
          return order.indexOf(tagA) - order.indexOf(tagB);
        },
      },
    });
  } else {
    console.log('Swagger documentation is disabled in this environment.');
  }

  await app.listen(process.env.PORT);
  logger.log(`App running in port ${process.env.PORT}`);
}
bootstrap();
