import { Controller, Get, Post, Put, Body, Param } from '@nestjs/common';
import { RiskService } from './risk.service';
import { CreateRiskRuleDto, UpdateRiskRuleDto } from './dto/risk-rule.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('risk')
@ApiBearerAuth()
@Controller('risk')
@Roles(Role.RISK_ANALYST, Role.ADMIN)
export class RiskController {
  constructor(private readonly riskService: RiskService) {}

  @Get('rules')
  async getRules() {
    return this.riskService.getRules();
  }

  @Post('rules')
  async createRule(@Body() dto: CreateRiskRuleDto) {
    return this.riskService.createRule(dto);
  }

  @Put('rules/:id')
  async updateRule(@Param('id') id: string, @Body() dto: UpdateRiskRuleDto) {
    return this.riskService.updateRule(id, dto);
  }
}
