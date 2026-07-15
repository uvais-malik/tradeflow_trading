import { Controller, Get, Param, Post, Patch, Body, UseGuards } from '@nestjs/common';
import { MarketsService } from './markets.service';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('markets')
@ApiBearerAuth()
@Controller('markets')
export class MarketsController {
  constructor(private readonly marketsService: MarketsService) {}

  @Get()
  async getMarkets() {
    return this.marketsService.getMarkets();
  }

  @Get('news')
  async getNews() {
    return this.marketsService.getNews();
  }

  @Get('calendar')
  async getCalendar() {
    return this.marketsService.getCalendar();
  }

  @Get(':symbol')
  async getMarket(@Param('symbol') symbol: string) {
    return this.marketsService.getMarketBySymbol(symbol);
  }

  @Get(':id/chart')
  async getChart(@Param('id') id: string) {
    return this.marketsService.getChartData(id);
  }

  // --- Admin Endpoints ---

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  async createMarket(@CurrentUser() admin: any, @Body() data: any) {
    return this.marketsService.createMarket(admin.userId, data);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  async updateMarket(@CurrentUser() admin: any, @Param('id') id: string, @Body() data: any) {
    return this.marketsService.updateMarket(admin.userId, id, data);
  }
}
