import { Module } from '@nestjs/common';
import { SettlementService } from './settlement.service';
import { LedgerModule } from '../ledger/ledger.module';
import { PortfolioModule } from '../portfolio/portfolio.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [LedgerModule, PortfolioModule, NotificationsModule],
  providers: [SettlementService],
})
export class SettlementModule {}

