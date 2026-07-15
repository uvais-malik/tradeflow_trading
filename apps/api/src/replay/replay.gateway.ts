import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ReplayService } from './replay.service';
import { Logger } from '@nestjs/common';

@WebSocketGateway({ cors: true, namespace: '/replay' })
export class ReplayGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ReplayGateway.name);

  constructor(private readonly replayService: ReplayService) {}

  handleConnection(client: Socket) {
    this.logger.log(`Client connected to Replay Engine: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected from Replay Engine: ${client.id}`);
    this.replayService.stopReplay(client.id);
  }

  @SubscribeMessage('replay:start')
  handleStartReplay(client: Socket, payload: { stockId: string; speed: number }) {
    this.replayService.startReplay(client, payload.stockId, payload.speed);
  }

  @SubscribeMessage('replay:stop')
  handleStopReplay(client: Socket) {
    this.replayService.stopReplay(client.id);
  }
}
