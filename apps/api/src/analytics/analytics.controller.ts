import { Controller, Get, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('overview')
  @Roles('ADMIN')
  async getOverview() {
    return this.analyticsService.getOverviewStats();
  }

  @Get('volume')
  @Roles('ADMIN')
  async getVolume() {
    return this.analyticsService.getVolumeByDay();
  }

  @Get('largest-trades')
  @Roles('ADMIN')
  async getLargestTrades() {
    return this.analyticsService.getLargestTrades();
  }

  @Get('order-status')
  @Roles('ADMIN')
  async getOrderStatus() {
    return this.analyticsService.getOrderStatusDistribution();
  }
}
