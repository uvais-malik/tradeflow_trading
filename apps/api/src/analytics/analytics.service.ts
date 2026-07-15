import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getOverviewStats() {
    const totalUsers = await this.prisma.user.count({ where: { isActive: true } });
    
    // Total Volume = sum of all Trade (price * quantity)
    // Prisma aggregation
    const trades = await this.prisma.trade.findMany({
      select: { price: true, quantity: true }
    });
    
    const totalVolume = trades.reduce((sum, t) => sum + (Number(t.price) * t.quantity), 0);
    const totalTradesCount = trades.length;
    
    const openOrders = await this.prisma.order.count({
      where: { status: 'OPEN' }
    });

    return {
      totalUsers,
      totalVolume,
      totalTradesCount,
      openOrders
    };
  }

  async getVolumeByDay() {
    // We will group trades by day
    // Since SQLite/Postgres date truncation varies, doing it in memory is safest for this scale
    const trades = await this.prisma.trade.findMany({
      select: { executedAt: true, price: true, quantity: true },
      orderBy: { executedAt: 'asc' }
    });

    const dailyMap = new Map<string, { volume: number, count: number }>();

    for (const t of trades) {
      const date = t.executedAt.toISOString().split('T')[0]; // YYYY-MM-DD
      const val = dailyMap.get(date) || { volume: 0, count: 0 };
      val.volume += Number(t.price) * t.quantity;
      val.count += 1;
      dailyMap.set(date, val);
    }

    const result = Array.from(dailyMap.entries()).map(([date, data]) => ({
      date,
      volume: data.volume,
      tradesCount: data.count
    }));

    return result;
  }

  async getLargestTrades() {
    // Fetch trades, calculate value, sort descending
    const trades = await this.prisma.trade.findMany({
      include: { stock: true },
      take: 1000 // Get recent trades, sort in memory
    });

    const sorted = trades.sort((a, b) => {
      const valA = Number(a.price) * a.quantity;
      const valB = Number(b.price) * b.quantity;
      return valB - valA;
    });

    return sorted.slice(0, 10).map(t => ({
      id: t.id,
      symbol: t.stock.symbol,
      price: Number(t.price),
      quantity: t.quantity,
      totalValue: Number(t.price) * t.quantity,
      executedAt: t.executedAt
    }));
  }

  async getOrderStatusDistribution() {
    const distribution = await this.prisma.order.groupBy({
      by: ['status'],
      _count: {
        id: true,
      },
    });

    return distribution.map(d => ({
      name: d.status,
      value: d._count.id
    }));
  }
}
