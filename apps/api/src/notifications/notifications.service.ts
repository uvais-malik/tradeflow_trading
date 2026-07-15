import { Injectable, NotFoundException } from '@nestjs/common';
import { Notification } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { WebsocketGateway } from '../websocket/websocket.gateway';

type ToastType = 'success' | 'error' | 'info';

@Injectable()
export class NotificationsService {
  constructor(
    private prisma: PrismaService,
    private wsGateway: WebsocketGateway,
  ) {}

  async createForUser(userId: string, type: string, message: string): Promise<Notification> {
    const notification = await this.prisma.notification.create({
      data: { userId, type, message },
    });

    this.wsGateway.broadcastNotification(notification, this.toToastType(type));
    return notification;
  }

  async getForUser(userId: string): Promise<Notification[]> {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async markAsRead(userId: string, notificationId: string): Promise<Notification> {
    const result = await this.prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { isRead: true },
    });

    if (result.count === 0) {
      throw new NotFoundException('Notification not found');
    }

    return this.prisma.notification.findUniqueOrThrow({ where: { id: notificationId } });
  }

  private toToastType(type: string): ToastType {
    if (type.includes('REJECTED') || type.includes('FAILED') || type.includes('CANCELLED')) {
      return 'error';
    }

    if (type.includes('FILLED') || type.includes('SETTLED') || type.includes('DEPOSIT')) {
      return 'success';
    }

    return 'info';
  }
}
