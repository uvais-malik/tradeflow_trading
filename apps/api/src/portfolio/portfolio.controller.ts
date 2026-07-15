import { Controller, Get } from '@nestjs/common';
import { PortfolioService } from './portfolio.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('portfolio')
@ApiBearerAuth()
@Controller('portfolio')
export class PortfolioController {
  constructor(private readonly portfolioService: PortfolioService) {}

  @Get('holdings')
  async getHoldings(@CurrentUser() user: any) {
    return this.portfolioService.getHoldings(user.userId);
  }

  @Get('summary')
  async getSummary(@CurrentUser() user: any) {
    return this.portfolioService.getSummary(user.userId);
  }

  @Get('insights')
  async getInsights(@CurrentUser() user: any) {
    return this.portfolioService.getInsights(user.userId);
  }

  @Roles(Role.PORTFOLIO_MANAGER, Role.ADMIN)
  @Get('firm-summary')
  async getFirmSummary() {
    return this.portfolioService.getFirmSummary();
  }

  @Roles(Role.PORTFOLIO_MANAGER, Role.ADMIN)
  @Get('firm-trades')
  async getFirmTrades() {
    return this.portfolioService.getFirmTrades();
  }
}
