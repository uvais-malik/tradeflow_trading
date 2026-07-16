import { BadRequestException, Injectable, Inject } from '@nestjs/common';
import { Order, OrderSide, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class PortfolioService {
  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async getHoldings(userId: string) {
    return this.prisma.holding.findMany({
      where: { userId },
      include: { stock: true },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getSummary(userId: string): Promise<{
    cash: number;
    totalPortfolioValue: number;
    totalAccountValue: number;
    totalUnrealizedPnL: number;
    totalRealizedPnL: number;
  }> {
    const cacheKey = `portfolio_summary_${userId}`;
    const cachedSummary = await this.cacheManager.get<{
      cash: number;
      totalPortfolioValue: number;
      totalAccountValue: number;
      totalUnrealizedPnL: number;
      totalRealizedPnL: number;
    }>(cacheKey);
    
    if (cachedSummary) {
      return cachedSummary;
    }

    const [holdings, user] = await Promise.all([
      this.getHoldings(userId),
      this.prisma.user.findUnique({ where: { id: userId }, select: { walletBalance: true } }),
    ]);

    let totalPortfolioValue = 0;
    let totalUnrealizedPnL = 0;

    for (const holding of holdings) {
      const currentPrice = Number(holding.stock.currentPrice);
      const avgPrice = Number(holding.avgBuyPrice);
      const quantity = holding.quantity;

      totalPortfolioValue += currentPrice * quantity;
      totalUnrealizedPnL += (currentPrice - avgPrice) * quantity;
    }

    const result = {
      cash: Number(user?.walletBalance ?? 0),
      totalPortfolioValue,
      totalAccountValue: totalPortfolioValue + Number(user?.walletBalance ?? 0),
      totalUnrealizedPnL,
      totalRealizedPnL: 0,
    };

    // Cache the result (TTL is globally configured to 30s)
    await this.cacheManager.set(cacheKey, result);

    return result;
  }

  async updateHoldingOnTrade(
    order: Order,
    fillPrice: number,
    fillQuantity: number,
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    const prismaClient = tx ?? this.prisma;
    const holding = await prismaClient.holding.findUnique({
      where: {
        userId_stockId: {
          userId: order.userId,
          stockId: order.stockId,
        },
      },
    });

    if (order.side === OrderSide.BUY) {
      if (!holding) {
        await prismaClient.holding.create({
          data: {
            userId: order.userId,
            stockId: order.stockId,
            quantity: fillQuantity,
            avgBuyPrice: fillPrice,
          },
        });
        return;
      }

      const currentQty = holding.quantity;
      const currentAvgPrice = Number(holding.avgBuyPrice);
      const newQty = currentQty + fillQuantity;
      const newAvgPrice = ((currentQty * currentAvgPrice) + (fillQuantity * fillPrice)) / newQty;

      await prismaClient.holding.update({
        where: { id: holding.id },
        data: {
          quantity: newQty,
          avgBuyPrice: newAvgPrice,
        },
      });
      return;
    }

    if (!holding || holding.quantity < fillQuantity) {
      throw new BadRequestException('Settlement failed: insufficient settled shares for SELL order');
    }

    await prismaClient.holding.update({
      where: { id: holding.id },
      data: {
        quantity: holding.quantity - fillQuantity,
      },
    });
  }

  async getFirmSummary() {
    const [allUsers, allHoldings] = await Promise.all([
      this.prisma.user.findMany({ select: { id: true, fullName: true, walletBalance: true } }),
      this.prisma.holding.findMany({ include: { stock: true } }),
    ]);

    let totalFirmCash = 0;
    let totalFirmPortfolioValue = 0;
    let totalFirmUnrealizedPnL = 0;

    const userPerformances = new Map<string, { name: string; pnl: number; portfolioValue: number }>();
    const stockHoldings = new Map<string, { symbol: string; totalValue: number }>();

    for (const user of allUsers) {
      totalFirmCash += Number(user.walletBalance);
      userPerformances.set(user.id, { name: user.fullName, pnl: 0, portfolioValue: 0 });
    }

    for (const holding of allHoldings) {
      const currentPrice = Number(holding.stock.currentPrice);
      const avgPrice = Number(holding.avgBuyPrice);
      const quantity = holding.quantity;

      const positionValue = currentPrice * quantity;
      const unrealizedPnL = (currentPrice - avgPrice) * quantity;

      totalFirmPortfolioValue += positionValue;
      totalFirmUnrealizedPnL += unrealizedPnL;

      // Update user performance
      const userPerf = userPerformances.get(holding.userId);
      if (userPerf) {
        userPerf.pnl += unrealizedPnL;
        userPerf.portfolioValue += positionValue;
      }

      // Update stock aggregation
      const stockAggr = stockHoldings.get(holding.stockId) || { symbol: holding.stock.symbol, totalValue: 0 };
      stockAggr.totalValue += positionValue;
      stockHoldings.set(holding.stockId, stockAggr);
    }

    // Sort top performers
    const topPerformers = Array.from(userPerformances.values())
      .sort((a, b) => b.pnl - a.pnl)
      .slice(0, 5);

    // Sort top holdings
    const topHoldings = Array.from(stockHoldings.values())
      .sort((a, b) => b.totalValue - a.totalValue)
      .slice(0, 5);

    return {
      totalFirmCash,
      totalFirmPortfolioValue,
      totalFirmAUM: totalFirmCash + totalFirmPortfolioValue,
      totalFirmUnrealizedPnL,
      topPerformers,
      topHoldings,
    };
  }

  async getFirmTrades() {
    return this.prisma.trade.findMany({
      take: 50,
      orderBy: { executedAt: 'desc' },
      include: {
        stock: true,
        buyOrder: { select: { user: { select: { fullName: true } } } },
        sellOrder: { select: { user: { select: { fullName: true } } } },
      },
    });
  }

  async getInsights(userId: string) {
    const summary = await this.getSummary(userId);
    const holdings = await this.getHoldings(userId);

    const insights = [];
    
    // Check diversification
    if (holdings.length > 0) {
      let maxConcentration = 0;
      let topStock = '';

      for (const h of holdings) {
        const val = Number(h.stock.currentPrice) * h.quantity;
        const concentration = val / summary.totalPortfolioValue;
        if (concentration > maxConcentration) {
          maxConcentration = concentration;
          topStock = h.stock.symbol;
        }
      }

      if (maxConcentration > 0.5) {
        insights.push({
          type: 'warning',
          title: 'High Concentration Risk',
          description: `${topStock} makes up ${(maxConcentration * 100).toFixed(1)}% of your equity portfolio. Consider diversifying.`
        });
      } else {
        insights.push({
          type: 'success',
          title: 'Well Diversified',
          description: `Your portfolio is well diversified across multiple assets.`
        });
      }
    } else {
      insights.push({
        type: 'info',
        title: 'Start Trading',
        description: `Your portfolio is empty. Explore the markets to make your first trade.`
      });
    }

    if (summary.totalUnrealizedPnL > 0) {
      insights.push({
        type: 'success',
        title: 'Positive Performance',
        description: `Your unrealized profit is $${summary.totalUnrealizedPnL.toFixed(2)}.`
      });
    }

    return insights;
  }
}
