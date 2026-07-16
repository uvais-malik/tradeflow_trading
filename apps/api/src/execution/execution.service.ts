import { Inject, Injectable, Logger } from '@nestjs/common';
import { Order, OrderSide, OrderStatus, OrderType, Prisma, Trade } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { WebsocketGateway } from '../websocket/websocket.gateway';
import { OrderBookService } from './order-book.service';
import { ClientKafka } from '@nestjs/microservices';

interface OrderUpdate {
  userId: string;
  stockId: string;
  side: OrderSide;
  status: OrderStatus;
  filledQuantity: number;
  executedAt?: Date;
}

@Injectable()
export class ExecutionService {
  private readonly logger = new Logger(ExecutionService.name);

  constructor(
    private prisma: PrismaService,
    private wsGateway: WebsocketGateway,
    private orderBookService: OrderBookService,
    @Inject('KAFKA_CLIENT') private kafkaClient: ClientKafka,
  ) {}

  async matchOrder(incomingOrder: Order): Promise<void> {
    this.logger.log(`Matching Engine received order ${incomingOrder.id}`);

    // If it's a STOP_LOSS order, rest it immediately in the stop books.
    if (incomingOrder.orderType === OrderType.STOP_LOSS) {
      this.orderBookService.addOrder(incomingOrder);
      // Immediately check if it should trigger based on the current market price
      const stock = await this.prisma.stock.findUnique({ where: { id: incomingOrder.stockId } });
      if (stock) {
        await this.checkStopOrders(incomingOrder.stockId, Number(stock.currentPrice));
      }
      return;
    }

    const originalIncomingFilledQuantity = incomingOrder.filledQuantity;
    let remainingQty = incomingOrder.quantity - incomingOrder.filledQuantity;
    if (remainingQty <= 0 || incomingOrder.status !== OrderStatus.OPEN) {
      return;
    }

    const executedAt = new Date();
    const tradesToCreate: Prisma.TradeUncheckedCreateInput[] = [];
    const ordersToUpdate = new Map<string, OrderUpdate>();

    while (remainingQty > 0) {
      const bestMatch = incomingOrder.side === OrderSide.BUY
        ? this.orderBookService.getTopAsk(incomingOrder.stockId)
        : this.orderBookService.getTopBid(incomingOrder.stockId);

      if (!bestMatch) {
        break;
      }

      if (!this.hasPriceOverlap(incomingOrder, bestMatch)) {
        break;
      }

      const matchRemaining = bestMatch.quantity - bestMatch.filledQuantity;
      const tradeQty = Math.min(remainingQty, matchRemaining);
      const executionPrice = Number(bestMatch.price);

      tradesToCreate.push({
        buyOrderId: incomingOrder.side === OrderSide.BUY ? incomingOrder.id : bestMatch.id,
        sellOrderId: incomingOrder.side === OrderSide.SELL ? incomingOrder.id : bestMatch.id,
        stockId: incomingOrder.stockId,
        price: executionPrice,
        quantity: tradeQty,
        executedAt,
      });

      remainingQty -= tradeQty;

      const newBestMatchFilledQty = bestMatch.filledQuantity + tradeQty;
      const bestMatchStatus = newBestMatchFilledQty >= bestMatch.quantity
        ? OrderStatus.FILLED
        : OrderStatus.PARTIALLY_FILLED;

      bestMatch.filledQuantity = newBestMatchFilledQty;
      bestMatch.status = bestMatchStatus;

      ordersToUpdate.set(bestMatch.id, {
        userId: bestMatch.userId,
        stockId: bestMatch.stockId,
        side: bestMatch.side,
        status: bestMatchStatus,
        filledQuantity: newBestMatchFilledQty,
        executedAt,
      });

      if (bestMatchStatus === OrderStatus.FILLED) {
        this.orderBookService.removeOrder(bestMatch.id, bestMatch.stockId, bestMatch.side);
      }
    }

    const newIncomingFilledQty = incomingOrder.quantity - remainingQty;
    let incomingStatus: OrderStatus = incomingOrder.status;

    if (newIncomingFilledQty > 0) {
      incomingStatus = remainingQty === 0 ? OrderStatus.FILLED : OrderStatus.PARTIALLY_FILLED;
    }

    if (remainingQty > 0 && incomingOrder.orderType === OrderType.LIMIT) {
      incomingOrder.filledQuantity = newIncomingFilledQty;
      incomingOrder.status = incomingStatus;
      this.orderBookService.addOrder(incomingOrder);
    } else if (remainingQty > 0 && incomingOrder.orderType === OrderType.MARKET) {
      incomingStatus = newIncomingFilledQty > 0 ? incomingStatus : OrderStatus.CANCELLED;
    }

    ordersToUpdate.set(incomingOrder.id, {
      userId: incomingOrder.userId,
      stockId: incomingOrder.stockId,
      side: incomingOrder.side,
      status: incomingStatus,
      filledQuantity: newIncomingFilledQty,
      executedAt: newIncomingFilledQty > originalIncomingFilledQuantity ? executedAt : undefined,
    });

    if (tradesToCreate.length === 0 && incomingStatus === incomingOrder.status) {
      return;
    }

    const createdTrades = await this.prisma.$transaction(async (tx) => {
      const trades: Trade[] = [];

      for (const tradeInput of tradesToCreate) {
        const trade = await tx.trade.create({ data: tradeInput });
        trades.push(trade);

        // Emit Kafka Event for async audit logging & notifications
        this.kafkaClient.emit('trade.executed', {
          tradeId: trade.id,
          buyOrderId: trade.buyOrderId,
          sellOrderId: trade.sellOrderId,
          stockId: trade.stockId,
          price: Number(trade.price),
          quantity: trade.quantity,
        });
      }

      for (const [orderId, data] of ordersToUpdate.entries()) {
        await tx.order.update({
          where: { id: orderId },
          data: {
            status: data.status,
            filledQuantity: data.filledQuantity,
            ...(data.executedAt ? { executedAt: data.executedAt } : {}),
          },
        });

        // Emit Kafka Event for order status changes
        this.kafkaClient.emit('order.status_changed', {
          orderId,
          userId: data.userId,
          status: data.status,
          filledQuantity: data.filledQuantity,
        });
      }

      return trades;
    });

    if (createdTrades.length > 0) {
      const depth = this.orderBookService.getDepth(incomingOrder.stockId);
      this.wsGateway.broadcastOrderBook(incomingOrder.stockId, depth);
    }
  }

  async checkStopOrders(stockId: string, currentPrice: number): Promise<void> {
    const triggered = this.orderBookService.getTriggeredStopOrders(stockId, currentPrice);
    for (const order of triggered) {
      this.logger.log(`Stop order ${order.id} triggered at price ${currentPrice}`);
      
      // Remove from the stop book
      this.orderBookService.removeOrder(order.id, stockId, order.side);
      
      // Temporarily treat it as a MARKET order in memory
      order.orderType = OrderType.MARKET;
      
      // Match it recursively
      await this.matchOrder(order);
    }
  }

  removeRestingOrder(order: Order): void {
    this.orderBookService.removeOrder(order.id, order.stockId, order.side);
    this.wsGateway.broadcastOrderBook(order.stockId, this.orderBookService.getDepth(order.stockId));
  }

  replaceRestingOrder(order: Order): void {
    this.orderBookService.removeOrder(order.id, order.stockId, order.side);

    if (order.status === OrderStatus.OPEN && (order.orderType === OrderType.LIMIT || order.orderType === OrderType.STOP_LOSS)) {
      this.orderBookService.addOrder(order);
    }

    this.wsGateway.broadcastOrderBook(order.stockId, this.orderBookService.getDepth(order.stockId));
  }

  private hasPriceOverlap(incomingOrder: Order, bestMatch: Order): boolean {
    if (incomingOrder.orderType === OrderType.MARKET || incomingOrder.orderType === OrderType.STOP_LOSS) {
      return true;
    }

    if (incomingOrder.side === OrderSide.BUY) {
      return Number(incomingOrder.price) >= Number(bestMatch.price);
    }

    return Number(incomingOrder.price) <= Number(bestMatch.price);
  }
}


