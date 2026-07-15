import { Module } from '@nestjs/common';
import { ExecutionService } from './execution.service';
import { WebsocketModule } from '../websocket/websocket.module';
import { LedgerModule } from '../ledger/ledger.module';
import { PortfolioModule } from '../portfolio/portfolio.module';
import { NotificationsModule } from '../notifications/notifications.module';

import { OrderBookService } from './order-book.service';

@Module({
  imports: [WebsocketModule, LedgerModule, PortfolioModule, NotificationsModule],
  providers: [ExecutionService, OrderBookService],
  exports: [ExecutionService, OrderBookService],
})
export class ExecutionModule {}

