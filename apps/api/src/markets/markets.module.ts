import { Module } from '@nestjs/common';
import { MarketsController } from './markets.controller';
import { MarketsService } from './markets.service';
import { WebsocketModule } from '../websocket/websocket.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [WebsocketModule, ScheduleModule.forRoot()],
  controllers: [MarketsController],
  providers: [MarketsService],
})
export class MarketsModule {}
