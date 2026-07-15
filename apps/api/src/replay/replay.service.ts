import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrderBookService } from '../execution/order-book.service';
import { Socket } from 'socket.io';
import { Order, Trade } from '@prisma/client';

type TimelineEvent = 
  | { type: 'ORDER', timestamp: number, data: Order }
  | { type: 'TRADE', timestamp: number, data: Trade };

class ReplaySession {
  public orderBook = new OrderBookService(null as any);
  public events: TimelineEvent[] = [];
  public currentIndex = 0;
  public intervalId: NodeJS.Timeout | null = null;
  public virtualTime: number = 0;

  constructor(
    public readonly sessionId: string,
    public readonly stockId: string,
    public readonly socket: Socket,
    public readonly speed: number,
  ) {}
}

@Injectable()
export class ReplayService {
  private readonly logger = new Logger(ReplayService.name);
  private sessions = new Map<string, ReplaySession>();

  constructor(private readonly prisma: PrismaService) {}

  async startReplay(socket: Socket, stockId: string, speed: number = 10) {
    const sessionId = socket.id;
    if (this.sessions.has(sessionId)) {
      this.stopReplay(sessionId);
    }

    this.logger.log(`Starting replay for stock ${stockId} at ${speed}x speed for ${sessionId}`);
    
    // 1. Fetch data
    const orders = await this.prisma.order.findMany({
      where: { stockId },
      orderBy: { createdAt: 'asc' },
    });

    const trades = await this.prisma.trade.findMany({
      where: { stockId },
      orderBy: { executedAt: 'asc' },
    });

    // 2. Build Timeline
    const events: TimelineEvent[] = [];
    for (const o of orders) {
      events.push({ type: 'ORDER', timestamp: o.createdAt.getTime(), data: o });
    }
    for (const t of trades) {
      events.push({ type: 'TRADE', timestamp: t.executedAt.getTime(), data: t });
    }
    events.sort((a, b) => a.timestamp - b.timestamp);

    if (events.length === 0) {
      socket.emit('replay:error', { message: 'No historical data found for this stock' });
      return;
    }

    const session = new ReplaySession(sessionId, stockId, socket, speed);
    session.events = events;
    session.virtualTime = events[0].timestamp; // Start at the first event
    this.sessions.set(sessionId, session);

    // Start playback loop
    // Base tick rate is 100ms real time.
    const TICK_RATE_MS = 100;
    
    session.intervalId = setInterval(() => {
      // Advance virtual time
      const virtualDelta = TICK_RATE_MS * session.speed;
      session.virtualTime += virtualDelta;

      let hasBookUpdate = false;

      // Process events up to current virtual time
      while (session.currentIndex < session.events.length) {
        const ev = session.events[session.currentIndex];
        if (ev.timestamp > session.virtualTime) {
          break; // Future event, wait for next tick
        }

        if (ev.type === 'ORDER') {
          // Reset filledQuantity for replay purposes (since we replay from scratch)
          const order = { ...ev.data, filledQuantity: 0 };
          session.orderBook.addOrder(order);
          hasBookUpdate = true;
        } else if (ev.type === 'TRADE') {
          const trade = ev.data;
          // Deduct from book
          session.orderBook.deductQuantity(trade.buyOrderId, stockId, 'BUY' as any, trade.quantity);
          session.orderBook.deductQuantity(trade.sellOrderId, stockId, 'SELL' as any, trade.quantity);
          hasBookUpdate = true;
          
          socket.emit('replay:trade', trade);
          socket.emit('replay:price', { symbol: stockId, price: trade.price, virtualTime: session.virtualTime });
        }

        session.currentIndex++;
      }

      if (hasBookUpdate) {
        socket.emit('replay:orderbook', { stockId, depth: session.orderBook.getDepth(stockId, 15) });
      }

      socket.emit('replay:time', { virtualTime: session.virtualTime });

      // Check if finished
      if (session.currentIndex >= session.events.length) {
        socket.emit('replay:finished');
        this.stopReplay(sessionId);
      }

    }, TICK_RATE_MS);
  }

  stopReplay(sessionId: string) {
    const session = this.sessions.get(sessionId);
    if (session) {
      if (session.intervalId) clearInterval(session.intervalId);
      this.sessions.delete(sessionId);
      this.logger.log(`Stopped replay for ${sessionId}`);
    }
  }
}
