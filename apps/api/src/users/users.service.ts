import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async create(data: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({ data });
  }

  async deposit(userId: string, amountInput: number): Promise<User> {
    const amount = this.normalizeAmount(amountInput);

    const updatedUser = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id: userId },
        data: { walletBalance: { increment: amount } },
      });

      await tx.auditLog.create({
        data: {
          actorId: userId,
          action: 'WALLET_DEPOSITED',
          entityType: 'USER',
          entityId: userId,
          metadata: { amount },
        },
      });

      return user;
    });

    await this.notificationsService.createForUser(
      userId,
      'WALLET_DEPOSITED',
      `$${amount.toFixed(2)} deposited into your wallet.`,
    );

    return updatedUser;
  }

  async withdraw(userId: string, amountInput: number): Promise<User> {
    const amount = this.normalizeAmount(amountInput);

    const updatedUser = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user || Number(user.walletBalance) < amount) {
        throw new BadRequestException('Insufficient available cash for withdrawal');
      }

      const updated = await tx.user.update({
        where: { id: userId },
        data: { walletBalance: { decrement: amount } },
      });

      await tx.auditLog.create({
        data: {
          actorId: userId,
          action: 'WALLET_WITHDRAWN',
          entityType: 'USER',
          entityId: userId,
          metadata: { amount },
        },
      });

      return updated;
    });

    await this.notificationsService.createForUser(
      userId,
      'WALLET_WITHDRAWN',
      `$${amount.toFixed(2)} withdrawn from your wallet.`,
    );

    return updatedUser;
  }

  private normalizeAmount(amountInput: number): number {
    const amount = Number(amountInput);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new BadRequestException('Amount must be a positive number');
    }

    return Number(amount.toFixed(2));
  }

  async findAll(): Promise<User[]> {
    const users = await this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
    });
    // Strip passwords
    return users.map(u => {
      const { passwordHash, ...rest } = u;
      return rest as any;
    });
  }

  async updateRole(adminId: string, targetUserId: string, newRole: string): Promise<User> {
    const updated = await this.prisma.user.update({
      where: { id: targetUserId },
      data: { role: newRole as any },
    });
    
    await this.prisma.auditLog.create({
      data: {
        actorId: adminId,
        action: 'USER_ROLE_UPDATED',
        entityType: 'USER',
        entityId: targetUserId,
        metadata: { newRole },
      },
    });

    const { passwordHash, ...rest } = updated;
    return rest as any;
  }

  async updateStatus(adminId: string, targetUserId: string, isActive: boolean): Promise<User> {
    const updated = await this.prisma.user.update({
      where: { id: targetUserId },
      data: { isActive },
    });
    
    await this.prisma.auditLog.create({
      data: {
        actorId: adminId,
        action: 'USER_STATUS_UPDATED',
        entityType: 'USER',
        entityId: targetUserId,
        metadata: { isActive },
      },
    });

    const { passwordHash, ...rest } = updated;
    return rest as any;
  }
}
