import { Injectable, Logger, forwardRef, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WebsocketGateway } from '../websocket/websocket.gateway';
import { Interval } from '@nestjs/schedule';
import { ExecutionService } from '../execution/execution.service';

@Injectable()
export class MarketsService {
  private readonly logger = new Logger(MarketsService.name);

  constructor(
    private prisma: PrismaService,
    private wsGateway: WebsocketGateway,
    @Inject(forwardRef(() => ExecutionService))
    private executionService: ExecutionService,
  ) {}

  async getMarkets() {
    return this.prisma.stock.findMany();
  }

  async getMarketBySymbol(symbol: string) {
    return this.prisma.stock.findUnique({ where: { symbol } });
  }

  // Admin: Create new stock
  async createMarket(adminId: string, data: any) {
    const stock = await this.prisma.stock.create({
      data: {
        symbol: data.symbol,
        name: data.name,
        currentPrice: data.currentPrice,
        dayHigh: data.currentPrice,
        dayLow: data.currentPrice,
      }
    });

    await this.prisma.auditLog.create({
      data: {
        actorId: adminId,
        action: 'MARKET_CREATED',
        entityType: 'STOCK',
        entityId: stock.id,
        metadata: { symbol: stock.symbol },
      }
    });

    return stock;
  }

  // Admin: Update stock (e.g. halt trading, restrict)
  async updateMarket(adminId: string, id: string, data: any) {
    const stock = await this.prisma.stock.update({
      where: { id },
      data
    });

    await this.prisma.auditLog.create({
      data: {
        actorId: adminId,
        action: 'MARKET_UPDATED',
        entityType: 'STOCK',
        entityId: stock.id,
        metadata: data,
      }
    });

    return stock;
  }

  async getChartData(id: string) {
    const stock = await this.prisma.stock.findUnique({ where: { id } });
    if (!stock) throw new Error('Stock not found');
    
    // Generate 40 data points for a fake historical chart leading up to current price
    const dataPoints = [];
    let simulatedPrice = Number(stock.currentPrice);
    
    // Work backwards in time, generating prices
    const now = new Date();
    for (let i = 40; i >= 0; i--) {
      dataPoints.push({
        time: new Date(now.getTime() - i * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        price: simulatedPrice
      });
      
      // Reverse random walk
      const volatility = 0.003; 
      const changePercent = (Math.random() - 0.5) * 2 * volatility;
      simulatedPrice = simulatedPrice / (1 + changePercent);
    }
    
    return dataPoints;
  }

  @Interval(2000)
  async simulateMarketPrices() {
    // Basic price jitter simulation
    const stocks = await this.prisma.stock.findMany();
    for (const stock of stocks) {
      if (stock.isTradingHalted) continue;

      const volatility = 0.005; // 0.5% max movement
      const changePercent = (Math.random() - 0.5) * 2 * volatility;
      const currentPriceNum = Number(stock.currentPrice);
      const newPrice = currentPriceNum * (1 + changePercent);

      await this.prisma.stock.update({
        where: { id: stock.id },
        data: {
          currentPrice: newPrice,
          dayHigh: Math.max(Number(stock.dayHigh), newPrice),
          dayLow: Math.min(Number(stock.dayLow), newPrice),
        },
      });

      this.wsGateway.broadcastPriceUpdate(stock.symbol, newPrice);
      
      // Trigger any stop loss orders
      await this.executionService.checkStopOrders(stock.id, newPrice);
    }
  }

  async getNews() {
    const apiKey = process.env.FINNHUB_API_KEY;
    if (!apiKey) {
      this.logger.warn('FINNHUB_API_KEY is not set. Returning mock news.');
      return [
        { id: 1, headline: 'Global markets rally on tech earnings', source: 'Reuters', datetime: Math.floor(Date.now() / 1000), url: '#' },
        { id: 2, headline: 'Fed signals rate cuts may come sooner than expected', source: 'Bloomberg', datetime: Math.floor(Date.now() / 1000) - 3600, url: '#' },
        { id: 3, headline: 'Oil prices stabilize after recent volatility', source: 'WSJ', datetime: Math.floor(Date.now() / 1000) - 7200, url: '#' },
        { id: 4, headline: 'Crypto regulation framework proposed in EU', source: 'CoinDesk', datetime: Math.floor(Date.now() / 1000) - 14400, url: '#' },
      ];
    }

    try {
      // Finnhub API limits to 1 year of general news, we use general category
      const response = await fetch(`https://finnhub.io/api/v1/news?category=general&token=${apiKey}`);
      if (!response.ok) {
        throw new Error(`Finnhub API error: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      // Return top 15 news items
      return data.slice(0, 15);
    } catch (e) {
      this.logger.error('Failed to fetch news from Finnhub', e);
      return [];
    }
  }

  async getCalendar() {
    return [
      { id: 1, event: 'AAPL Earnings', type: 'Earnings', date: new Date(Date.now() + 86400000).toISOString() },
      { id: 2, event: 'FOMC Meeting', type: 'Macro', date: new Date(Date.now() + 172800000).toISOString() },
      { id: 3, event: 'TSLA Dividend Ex-Date', type: 'Dividend', date: new Date(Date.now() + 345600000).toISOString() },
      { id: 4, event: 'Stripe IPO Pricing', type: 'IPO', date: new Date(Date.now() + 604800000).toISOString() },
    ];
  }
}

