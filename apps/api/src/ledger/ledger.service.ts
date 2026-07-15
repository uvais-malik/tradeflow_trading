import { Injectable } from '@nestjs/common';
import { Order, OrderSide, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LedgerService {
  constructor(private prisma: PrismaService) {}

  async recordTrade(
    order: Order,
    tradeId: string,
    fillPrice: number,
    fillQuantity: number,
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    const prismaClient = tx ?? this.prisma;
    const totalValue = Number((fillPrice * fillQuantity).toFixed(2));

    let cashDebit = 0;
    let cashCredit = 0;
    let securitiesDebit = 0;
    let securitiesCredit = 0;

    if (order.side === OrderSide.BUY) {
      securitiesDebit = totalValue;
      cashCredit = totalValue;
    } else {
      cashDebit = totalValue;
      securitiesCredit = totalValue;
    }

    await prismaClient.ledgerEntry.createMany({
      data: [
        {
          orderId: order.id,
          tradeId,
          account: 'CASH',
          debit: cashDebit,
          credit: cashCredit,
        },
        {
          orderId: order.id,
          tradeId,
          account: 'SECURITIES',
          debit: securitiesDebit,
          credit: securitiesCredit,
        },
      ],
    });

    await prismaClient.user.update({
      where: { id: order.userId },
      data: {
        walletBalance: order.side === OrderSide.BUY
          ? { decrement: totalValue }
          : { increment: totalValue },
      },
    });
  }

  async validateDoubleEntryInvariant(orderId: string): Promise<boolean> {
    const entries = await this.prisma.ledgerEntry.findMany({ where: { orderId } });
    if (entries.length === 0) return true;

    const totals = entries.reduce(
      (sum, entry) => ({
        debits: sum.debits + Number(entry.debit),
        credits: sum.credits + Number(entry.credit),
      }),
      { debits: 0, credits: 0 },
    );

    return Math.abs(totals.debits - totals.credits) < 0.0001;
  }
}
