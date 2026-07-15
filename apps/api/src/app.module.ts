import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AuditInterceptor } from './common/interceptors/audit.interceptor';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { MarketsModule } from './markets/markets.module';
import { OrdersModule } from './orders/orders.module';
import { LedgerModule } from './ledger/ledger.module';
import { PortfolioModule } from './portfolio/portfolio.module';
import { RiskModule } from './risk/risk.module';
import { ExecutionModule } from './execution/execution.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { ScheduleModule } from '@nestjs/schedule';
import { SettlementModule } from './settlement/settlement.module';
import { ReplayModule } from './replay/replay.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { ComplianceModule } from './compliance/compliance.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AuditModule } from './audit/audit.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    UsersModule,
    MarketsModule,
    OrdersModule,
    LedgerModule,
    PortfolioModule,
    RiskModule,
    ExecutionModule,
    SettlementModule,
    ReplayModule,
    AnalyticsModule,
    ComplianceModule,
    NotificationsModule,
    AuditModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
  ],
})
export class AppModule {}

