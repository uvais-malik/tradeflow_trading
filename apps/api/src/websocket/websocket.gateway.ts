import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Notification } from '@prisma/client';
import { Server, Socket } from 'socket.io';

type ToastType = 'success' | 'error' | 'info';

@WebSocketGateway({ namespace: '/live', cors: { origin: '*' } })
export class WebsocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  broadcastPriceUpdate(symbol: string, price: number) {
    this.server.emit('price:update', { symbol, price });
  }

  broadcastOrderStatus(orderId: string, status: string) {
    this.server.emit('order:status_changed', { orderId, status });
  }

  broadcastNotification(notification: Notification, toastType: ToastType = 'info') {
    this.server.emit('notification:new', {
      userId: notification.userId,
      message: notification.message,
      type: toastType,
      notification,
    });
  }

  notifyUser(userId: string, message: string, type: ToastType) {
    this.server.emit('notification:new', { userId, message, type });
  }

  broadcastOrderBook(stockId: string, depth: any) {
    this.server.emit('orderbook:update', { stockId, depth });
  }
}
