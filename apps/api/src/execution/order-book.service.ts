import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { Order, OrderSide, OrderStatus, OrderType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OrderBookService implements OnModuleInit {
  private readonly logger = new Logger(OrderBookService.name);
  // Map of stockId -> { bids: Order[], asks: Order[] }
  private books: Map<string, { bids: Order[]; asks: Order[] }> = new Map();

  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    this.logger.log('Hydrating Order Book from Database...');
    const activeOrders = await this.prisma.order.findMany({
      where: {
        status: { in: [OrderStatus.OPEN, OrderStatus.PARTIALLY_FILLED] },
        orderType: OrderType.LIMIT,
      },
      orderBy: { createdAt: 'asc' }
    });

    for (const order of activeOrders) {
      this.addOrder(order);
    }
    this.logger.log(`Hydrated ${activeOrders.length} limit orders into the memory book.`);
  }

  private getBook(stockId: string) {
    if (!this.books.has(stockId)) {
      this.books.set(stockId, { bids: [], asks: [] });
    }
    return this.books.get(stockId)!;
  }

  addOrder(order: Order) {
    this.removeOrder(order.id, order.stockId, order.side);
    const book = this.getBook(order.stockId);
    
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
    } else {
      book.asks = book.asks.filter(o => o.id !== orderId);
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
}

