import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule } from '@nestjs/config';
import { DriverJwtStrategy } from './strategies/driver-jwt.strategy';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'driver-jwt' }),
    ConfigModule,
  ],
  providers: [DriverJwtStrategy],
  exports: [DriverJwtStrategy, PassportModule],
})
export class AuthModule {}
