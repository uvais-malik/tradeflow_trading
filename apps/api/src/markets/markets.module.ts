import { forwardRef, Module } from '@nestjs/common';
import { MarketsController } from './markets.controller';
import { MarketsService } from './markets.service';
import { WebsocketModule } from '../websocket/websocket.module';
import { ScheduleModule } from '@nestjs/schedule';
import { ExecutionModule } from '../execution/execution.module';

@Module({
  imports: [WebsocketModule, ScheduleModule.forRoot(), forwardRef(() => ExecutionModule)],
  controllers: [MarketsController],
  providers: [MarketsService],
})
export class MarketsModule {}
