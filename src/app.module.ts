import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './common/database/database.module';
import { AuthModule } from './auth/auth.module';
import { DriverPortalModule } from './driver-portal/driver-portal.module';
import { DriverRequestsModule } from './driver-requests/driver-requests.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    DatabaseModule,
    AuthModule,
    DriverPortalModule,
    DriverRequestsModule,
  ],
})
export class AppModule {}
