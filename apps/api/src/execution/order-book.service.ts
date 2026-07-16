import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { Order, OrderSide, OrderStatus, OrderType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OrderBookService implements OnModuleInit {
  private readonly logger = new Logger(OrderBookService.name);
  // Map of stockId -> { bids: Order[], asks: Order[], stopBids: Order[], stopAsks: Order[] }
  private books: Map<string, { bids: Order[]; asks: Order[]; stopBids: Order[]; stopAsks: Order[] }> = new Map();

  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    this.logger.log('Hydrating Order Book from Database...');
    const activeOrders = await this.prisma.order.findMany({
      where: {
        status: { in: [OrderStatus.OPEN, OrderStatus.PARTIALLY_FILLED] },
        orderType: { in: [OrderType.LIMIT, OrderType.STOP_LOSS] },
      },
      orderBy: { createdAt: 'asc' }
    });

    for (const order of activeOrders) {
      this.addOrder(order);
    }
    this.logger.log(`Hydrated ${activeOrders.length} limit and stop orders into the memory book.`);
  }

  private getBook(stockId: string) {
    if (!this.books.has(stockId)) {
      this.books.set(stockId, { bids: [], asks: [], stopBids: [], stopAsks: [] });
    }
    return this.books.get(stockId)!;
  }

  addOrder(order: Order) {
    this.removeOrder(order.id, order.stockId, order.side);
    const book = this.getBook(order.stockId);
    
    if (order.orderType === OrderType.STOP_LOSS) {
      if (order.side === OrderSide.BUY) {
        book.stopBids.push(order);
      } else {
        book.stopAsks.push(order);
      }
      return;
    }

    if (order.side === OrderSide.BUY) {
      book.bids.push(order);
      // Sort bids: Price DESC, then Time ASC
      book.bids.sort((a, b) => {
        const priceDiff = Number(b.price) - Number(a.price);
        if (priceDiff !== 0) return priceDiff;
        return a.createdAt.getTime() - b.createdAt.getTime();
      });
    } else {
      book.asks.push(order);
      // Sort asks: Price ASC, then Time ASC
      book.asks.sort((a, b) => {
        const priceDiff = Number(a.price) - Number(b.price);
        if (priceDiff !== 0) return priceDiff;
        return a.createdAt.getTime() - b.createdAt.getTime();
      });
    }
  }

  removeOrder(orderId: string, stockId: string, side: OrderSide) {
    const book = this.getBook(stockId);
    if (side === OrderSide.BUY) {
      book.bids = book.bids.filter(o => o.id !== orderId);
      book.stopBids = book.stopBids.filter(o => o.id !== orderId);
    } else {
      book.asks = book.asks.filter(o => o.id !== orderId);
      book.stopAsks = book.stopAsks.filter(o => o.id !== orderId);
    }
  }

  deductQuantity(orderId: string, stockId: string, side: OrderSide, filledAmount: number) {
    const book = side === OrderSide.BUY ? this.getBook(stockId).bids : this.getBook(stockId).asks;
    const idx = book.findIndex(o => o.id === orderId);
    if (idx > -1) {
      book[idx].filledQuantity += filledAmount;
      if (book[idx].filledQuantity >= book[idx].quantity) {
        book.splice(idx, 1);
      }
    }
  }

  getTopBid(stockId: string): Order | undefined {
    return this.getBook(stockId).bids[0];
  }

  getTopAsk(stockId: string): Order | undefined {
    return this.getBook(stockId).asks[0];
  }

  getDepth(stockId: string, levels: number = 10) {
    const book = this.getBook(stockId);
    
    // Group by price
    const aggregate = (orders: Order[]) => {
      const levelsMap = new Map<number, number>();
      for (const o of orders) {
        const p = Number(o.price);
        const q = o.quantity - o.filledQuantity;
        levelsMap.set(p, (levelsMap.get(p) || 0) + q);
      }
      return Array.from(levelsMap.entries()).map(([price, quantity]) => ({ price, quantity }));
    };

    const bids = aggregate(book.bids).slice(0, levels);
    const asks = aggregate(book.asks).slice(0, levels);

    return { bids, asks };
  }

  getTriggeredStopOrders(stockId: string, currentPrice: number): Order[] {
    const book = this.getBook(stockId);
    const triggered: Order[] = [];

    // Buy Stop triggers if currentPrice >= stopPrice
    for (const order of book.stopBids) {
      if (currentPrice >= Number(order.price)) {
        triggered.push(order);
      }
    }

    // Sell Stop triggers if currentPrice <= stopPrice
    for (const order of book.stopAsks) {
      if (currentPrice <= Number(order.price)) {
        triggered.push(order);
      }
    }

    return triggered;
  }
}

