import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { WebsocketGateway } from '../websocket/websocket.gateway';
import { OrderStatus } from '@prisma/client';

@Controller()
export class KafkaConsumerController {
  private readonly logger = new Logger(KafkaConsumerController.name);

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private wsGateway: WebsocketGateway,
  ) {}

  @EventPattern('trade.executed')
  async handleTradeExecuted(@Payload() message: any) {
    this.logger.log(`Received trade.executed event for Trade ID: ${message.tradeId}`);
    
    // Asynchronously create the audit log so it doesn't block the matching engine
    await this.prisma.auditLog.create({
      data: {
        actorId: null,
        action: 'TRADE_EXECUTED',
        entityType: 'TRADE',
        entityId: message.tradeId,
        metadata: {
          buyOrderId: message.buyOrderId,
          sellOrderId: message.sellOrderId,
          stockId: message.stockId,
          price: message.price,
          quantity: message.quantity,
        },
      },
    });
  }

  @EventPattern('order.status_changed')
  async handleOrderStatusChanged(@Payload() message: any) {
    this.logger.log(`Received order.status_changed event for Order ID: ${message.orderId}`);
    
    // Asynchronously log to audit
    await this.prisma.auditLog.create({
      data: {
        actorId: message.userId,
        action: 'ORDER_STATUS_CHANGED',
        entityType: 'ORDER',
        entityId: message.orderId,
        metadata: {
          status: message.status,
          filledQuantity: message.filledQuantity,
        },
      },
    });

    // Send notifications
    this.wsGateway.broadcastOrderStatus(message.orderId, message.status);

    if (message.status === OrderStatus.FILLED) {
      await this.notificationsService.createForUser(
        message.userId,
        'ORDER_FILLED',
        `Order ${message.orderId.substring(0, 8)} filled. Settlement is now pending.`,
      );
    } else if (message.status === OrderStatus.PARTIALLY_FILLED) {
      await this.notificationsService.createForUser(
        message.userId,
        'ORDER_PARTIALLY_FILLED',
        `Order ${message.orderId.substring(0, 8)} partially filled for ${message.filledQuantity} shares.`,
      );
    } else if (message.status === OrderStatus.CANCELLED) {
      await this.notificationsService.createForUser(
        message.userId,
        'ORDER_CANCELLED',
        `Market order ${message.orderId.substring(0, 8)} was cancelled because no matching liquidity was available.`,
      );
    }
  }
}
