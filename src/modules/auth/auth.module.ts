import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { User } from '@/modules/user/entities/user.entity';

import { AuthService } from '@/modules/auth/auth.service';
import { AuthController } from '@/modules/auth/auth.controller';
import { JwtStrategy } from '@/modules/auth/strategies/jwt.strategy';

@Module({
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([User]),
    PassportModule.register({ defaultStrategy: 'jwt' }),

    // Async module loading
    JwtModule.registerAsync({
      imports: [ConfigModule], // Wait for the config module to be available
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return {
          secret: configService.get('JWT_SECRET_ACCESS'),
          signOptions: {
            expiresIn: '30m',
          },
        };
      },
    }),
  ],
  exports: [JwtStrategy, PassportModule, JwtModule, AuthService],
})
export class AuthModule {}
