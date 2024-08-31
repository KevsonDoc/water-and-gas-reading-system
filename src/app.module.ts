import { Module } from '@nestjs/common';
import { MonitorModule } from './monitor/monitor.module';
import { DatabaseModule } from './database/database.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    MonitorModule,
    DatabaseModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['arquivo.env'],
    }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
