import { Global, Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { KafkaConsumerController } from './kafka.controller';
import { AuditModule } from '../audit/audit.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PrismaModule } from '../prisma/prisma.module';
import { WebsocketModule } from '../websocket/websocket.module';

@Global()
@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'KAFKA_CLIENT',
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: 'tradeflow-api',
            brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
          },
          consumer: {
            groupId: 'tradeflow-consumer-group',
          },
        },
      },
    ]),
    AuditModule,
    NotificationsModule,
    PrismaModule,
    WebsocketModule,
  ],
  controllers: [KafkaConsumerController],
  exports: [ClientsModule],
})
export class KafkaModule {}
