import { Module } from '@nestjs/common';
import { MonitorService } from './monitor.service';
import { MonitorController } from './monitor.controller';
import { DatabaseModule } from 'src/database/database.module';
import { ModelAI } from './model-ai';

@Module({
  imports: [DatabaseModule],
  controllers: [MonitorController],
  providers: [MonitorService, ModelAI],
})
export class MonitorModule {}
