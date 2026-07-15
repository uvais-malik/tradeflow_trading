import { Injectable, NotFoundException } from '@nestjs/common';
import { OrderSide, OrderStatus, OrderType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from '../orders/dto/create-order.dto';
import { CreateRiskRuleDto, UpdateRiskRuleDto } from './dto/risk-rule.dto';

export interface RiskEvaluation {
  approved: boolean;
  reason?: string;
  effectivePrice: number;
  notional: number;
}

@Injectable()
export class RiskService {
  constructor(private prisma: PrismaService) {}

  async getRules() {
    return this.prisma.riskRule.findMany({
      orderBy: { createdAt: 'desc' }
    });
  }

  async createRule(dto: CreateRiskRuleDto) {
    return this.prisma.riskRule.create({
      data: {
        name: dto.name,
        ruleType: dto.ruleType,
        value: dto.value,
        isActive: dto.isActive ?? true,
      }
    });
  }

  async updateRule(id: string, dto: UpdateRiskRuleDto) {
    const rule = await this.prisma.riskRule.findUnique({ where: { id } });
    if (!rule) throw new NotFoundException('Risk Rule not found');

    return this.prisma.riskRule.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.value !== undefined && { value: dto.value }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      }
    });
  }

  async checkRiskRules(userId: string, orderDto: CreateOrderDto): Promise<RiskEvaluation> {
    const stock = await this.prisma.stock.findUnique({ where: { id: orderDto.stockId } });
    if (!stock) {
      return this.reject('Invalid security.', 0, 0);
    }

    if (stock.isTradingHalted) {
      return this.reject(`Trading is currently halted for ${stock.symbol}.`, Number(stock.currentPrice), 0);
    }

    if (stock.isRestricted) {
      return this.reject(`${stock.symbol} is on the restricted trading list.`, Number(stock.currentPrice), 0);
    }

    const effectivePrice = this.resolveEffectivePrice(orderDto, Number(stock.currentPrice));
    const notional = effectivePrice * orderDto.quantity;
    const rules = await this.prisma.riskRule.findMany({ where: { isActive: true } });

    for (const rule of rules) {
      const ruleValue = rule.value ? Number(rule.value) : null;

      if (rule.ruleType === 'MAX_QUANTITY' && ruleValue !== null && orderDto.quantity > ruleValue) {
        return this.reject(`Quantity exceeds global maximum allowed (${ruleValue})`, effectivePrice, notional);
      }

      if (rule.ruleType === 'MAX_DAILY_TRADE_VALUE' && ruleValue !== null) {
        const startOfDay = new Date();
        startOfDay.setUTCHours(0, 0, 0, 0);

        const trades = await this.prisma.trade.findMany({
          where: {
            OR: [{ buyOrder: { userId } }, { sellOrder: { userId } }],
            executedAt: { gte: startOfDay },
          },
          select: { price: true, quantity: true },
        });

        const dailyValue = trades.reduce((sum, trade) => sum + Number(trade.price) * trade.quantity, 0);
        if (dailyValue + notional > ruleValue) {
          return this.reject('Order exceeds your maximum daily trading value limit.', effectivePrice, notional);
        }
      }

      if (rule.ruleType === 'MAX_EXPOSURE' && ruleValue !== null) {
        const openBuyOrders = await this.prisma.order.findMany({
          where: {
            userId,
            side: OrderSide.BUY,
            status: { in: [OrderStatus.OPEN, OrderStatus.PARTIALLY_FILLED] },
          },
          select: { price: true, quantity: true, filledQuantity: true },
        });

        const openExposure = openBuyOrders.reduce(
          (sum, order) => sum + Number(order.price) * (order.quantity - order.filledQuantity),
          0,
        );

        if (openExposure + notional > ruleValue) {
          return this.reject('Order exceeds your maximum open exposure limit.', effectivePrice, notional);
        }
      }
    }

    if (orderDto.side === OrderSide.SELL) {
      const holding = await this.prisma.holding.findUnique({
        where: {
          userId_stockId: {
            userId,
            stockId: orderDto.stockId,
          },
        },
      });

      if (!holding || holding.quantity < orderDto.quantity) {
        return this.reject('Insufficient shares for SELL order', effectivePrice, notional);
      }
    }

    if (orderDto.side === OrderSide.BUY) {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        return this.reject('User not found', effectivePrice, notional);
      }

      if (Number(user.walletBalance) < notional) {
        return this.reject(
          `Insufficient funds. Available: $${Number(user.walletBalance).toFixed(2)}, Required: $${notional.toFixed(2)}`,
          effectivePrice,
          notional,
        );
      }
    }

    return { approved: true, effectivePrice, notional };
  }

  private resolveEffectivePrice(orderDto: CreateOrderDto, currentPrice: number): number {
    if (orderDto.orderType === OrderType.MARKET || orderDto.price <= 0) {
      return currentPrice;
    }

    return orderDto.price;
  }

  private reject(reason: string, effectivePrice: number, notional: number): RiskEvaluation {
    return { approved: false, reason, effectivePrice, notional };
  }
}
