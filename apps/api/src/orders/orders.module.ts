import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { WebsocketModule } from '../websocket/websocket.module';
import { RiskModule } from '../risk/risk.module';
import { ExecutionModule } from '../execution/execution.module';
import { ComplianceModule } from '../compliance/compliance.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [WebsocketModule, RiskModule, ExecutionModule, ComplianceModule, NotificationsModule],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}

