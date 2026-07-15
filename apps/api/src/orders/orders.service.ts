import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { Order, OrderStatus, OrderType, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto, UpdateOrderDto } from './dto/create-order.dto';
import { WebsocketGateway } from '../websocket/websocket.gateway';
import { RiskService } from '../risk/risk.service';
import { ExecutionService } from '../execution/execution.service';
import { ComplianceService } from '../compliance/compliance.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private wsGateway: WebsocketGateway,
    private riskService: RiskService,
    private executionService: ExecutionService,
    private complianceService: ComplianceService,
    private notificationsService: NotificationsService,
  ) {}

  async createOrder(userId: string, createOrderDto: CreateOrderDto) {
    const stock = await this.prisma.stock.findUnique({ where: { id: createOrderDto.stockId } });
    if (!stock) {
      throw new BadRequestException('Invalid security.');
    }

    const requestedPrice =
      createOrderDto.orderType === OrderType.MARKET || createOrderDto.price <= 0
        ? Number(stock.currentPrice)
        : createOrderDto.price;

    const createdOrder = await this.prisma.order.create({
      data: {
        userId,
        stockId: createOrderDto.stockId,
        side: createOrderDto.side,
        orderType: createOrderDto.orderType,
        validity: createOrderDto.validity,
        quantity: createOrderDto.quantity,
        price: requestedPrice,
        status: OrderStatus.CREATED,
      },
      include: { stock: true },
    });

    await this.audit(userId, 'ORDER_CREATED', 'ORDER', createdOrder.id, {
      side: createdOrder.side,
      orderType: createdOrder.orderType,
      quantity: createdOrder.quantity,
      price: Number(createdOrder.price),
      stockId: createdOrder.stockId,
    });
    this.wsGateway.broadcastOrderStatus(createdOrder.id, createdOrder.status);

    const complianceResult = await this.complianceService.checkCompliance(userId, createOrderDto.stockId);
    if (!complianceResult.approved) {
      await this.rejectOrder(createdOrder.id, userId, complianceResult.reason ?? 'Compliance rejected order');
      throw new BadRequestException(`Order Compliance Rejected: ${complianceResult.reason}`);
    }

    const riskResult = await this.riskService.checkRiskRules(userId, {
      ...createOrderDto,
      price: requestedPrice,
    });

    if (!riskResult.approved) {
      await this.rejectOrder(createdOrder.id, userId, riskResult.reason ?? 'Risk rejected order');
      throw new BadRequestException(`Order Risk Rejected: ${riskResult.reason}`);
    }

    const openOrder = await this.prisma.order.update({
      where: { id: createdOrder.id },
      data: { status: OrderStatus.OPEN, price: riskResult.effectivePrice },
    });

    await this.audit(userId, 'ORDER_OPENED', 'ORDER', openOrder.id, {
      notional: riskResult.notional,
      price: riskResult.effectivePrice,
    });
    this.wsGateway.broadcastOrderStatus(openOrder.id, openOrder.status);

    await this.executionService.matchOrder(openOrder);

    return this.prisma.order.findUnique({
      where: { id: openOrder.id },
      include: { stock: true, buyTrades: true, sellTrades: true },
    });
  }

  async getOrders(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      include: { stock: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async cancelOrder(userId: string, orderId: string) {
    const order = await this.findOwnedOrder(userId, orderId);
    if (order.status !== OrderStatus.CREATED && order.status !== OrderStatus.OPEN && order.status !== OrderStatus.PARTIALLY_FILLED) {
      throw new BadRequestException('Only CREATED, OPEN, or PARTIALLY_FILLED orders can be cancelled');
    }

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.CANCELLED },
    });

    this.executionService.removeRestingOrder(order);
    await this.audit(userId, 'ORDER_CANCELLED', 'ORDER', updated.id, { previousStatus: order.status });
    await this.notificationsService.createForUser(userId, 'ORDER_CANCELLED', `Order ${updated.id.substring(0, 8)} was cancelled.`);
    this.wsGateway.broadcastOrderStatus(updated.id, updated.status);
    return updated;
  }

  async modifyOrder(userId: string, orderId: string, updateOrderDto: UpdateOrderDto) {
    const order = await this.findOwnedOrder(userId, orderId);
    if (order.status !== OrderStatus.CREATED && order.status !== OrderStatus.OPEN) {
      throw new BadRequestException('Only CREATED or OPEN orders can be modified');
    }

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        ...(updateOrderDto.quantity !== undefined && { quantity: updateOrderDto.quantity }),
        ...(updateOrderDto.price !== undefined && { price: updateOrderDto.price }),
      },
    });

    this.executionService.replaceRestingOrder(updated);
    await this.audit(userId, 'ORDER_MODIFIED', 'ORDER', updated.id, updateOrderDto as any);
    this.wsGateway.broadcastOrderStatus(updated.id, updated.status);
    return updated;
  }

  async getExecutions(userId: string) {
    return this.prisma.trade.findMany({
      where: {
        OR: [{ buyOrder: { userId } }, { sellOrder: { userId } }],
      },
      include: {
        stock: true,
        buyOrder: true,
        sellOrder: true,
      },
      orderBy: { executedAt: 'desc' },
    });
  }

  private async findOwnedOrder(userId: string, orderId: string): Promise<Order> {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order || order.userId !== userId) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  private async rejectOrder(orderId: string, userId: string, reason: string): Promise<void> {
    const rejected = await this.prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.REJECTED, rejectionReason: reason },
    });

    await this.audit(userId, 'ORDER_REJECTED', 'ORDER', orderId, { reason });
    await this.notificationsService.createForUser(userId, 'ORDER_REJECTED', reason);
    this.wsGateway.broadcastOrderStatus(rejected.id, rejected.status);
  }

  private async audit(
    actorId: string,
    action: string,
    entityType: string,
    entityId: string,
    metadata: Prisma.InputJsonValue,
  ): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        actorId,
        action,
        entityType,
        entityId,
        metadata,
      },
    });
  }
}
