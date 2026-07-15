import { Injectable, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { LedgerService } from '../ledger/ledger.service';
import { PortfolioService } from '../portfolio/portfolio.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class SettlementService {
  private readonly logger = new Logger(SettlementService.name);

  constructor(
    private prisma: PrismaService,
    private ledgerService: LedgerService,
    private portfolioService: PortfolioService,
    private notificationsService: NotificationsService,
  ) {}

  @Interval(5000)
  async processSettlements() {
    const unsettledTrades = await this.prisma.trade.findMany({
      where: { isSettled: false },
      include: { buyOrder: true, sellOrder: true, stock: true },
      orderBy: { executedAt: 'asc' },
      take: 100,
    });

    for (const trade of unsettledTrades) {
      try {
        await this.prisma.$transaction(async (tx) => {
          await this.ledgerService.recordTrade(trade.buyOrder, trade.id, Number(trade.price), trade.quantity, tx);
          await this.portfolioService.updateHoldingOnTrade(trade.buyOrder, Number(trade.price), trade.quantity, tx);

          await this.ledgerService.recordTrade(trade.sellOrder, trade.id, Number(trade.price), trade.quantity, tx);
          await this.portfolioService.updateHoldingOnTrade(trade.sellOrder, Number(trade.price), trade.quantity, tx);

          await tx.trade.update({
            where: { id: trade.id },
            data: { isSettled: true },
          });

          await tx.auditLog.createMany({
            data: [
              {
                actorId: trade.buyOrder.userId,
                action: 'TRADE_SETTLED',
                entityType: 'TRADE',
                entityId: trade.id,
                metadata: {
                  side: 'BUY',
                  orderId: trade.buyOrderId,
                  stockId: trade.stockId,
                  quantity: trade.quantity,
                  price: Number(trade.price),
                },
              },
              {
                actorId: trade.sellOrder.userId,
                action: 'TRADE_SETTLED',
                entityType: 'TRADE',
                entityId: trade.id,
                metadata: {
                  side: 'SELL',
                  orderId: trade.sellOrderId,
                  stockId: trade.stockId,
                  quantity: trade.quantity,
                  price: Number(trade.price),
                },
              },
            ],
          });
        });

        const message = `${trade.stock.symbol} trade settled: ${trade.quantity} shares @ $${Number(trade.price).toFixed(2)}.`;
        await this.notificationsService.createForUser(trade.buyOrder.userId, 'TRADE_SETTLED', message);
        await this.notificationsService.createForUser(trade.sellOrder.userId, 'TRADE_SETTLED', message);

        this.logger.log(`Settled trade ${trade.id} for ${trade.quantity} shares @ $${trade.price}`);
      } catch (error) {
        this.logger.error(`Failed to settle trade ${trade.id}:`, error);
      }
    }
  }
}
