import { Controller, Get, Put, Body, Param } from '@nestjs/common';
import { ComplianceService } from './compliance.service';
import { UpdateStockComplianceDto, UpdateUserComplianceDto } from './dto/compliance.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('compliance')
@ApiBearerAuth()
@Controller('compliance')
@Roles(Role.COMPLIANCE_OFFICER, Role.ADMIN)
export class ComplianceController {
  constructor(private readonly complianceService: ComplianceService) {}

  @Get('stocks')
  async getStocks() {
    return this.complianceService.getStocks();
  }

  @Put('stocks/:id')
  async updateStock(@Param('id') id: string, @Body() dto: UpdateStockComplianceDto) {
    return this.complianceService.updateStock(id, dto);
  }

  @Get('users')
  async getUsers() {
    return this.complianceService.getUsers();
  }

  @Put('users/:id')
  async updateUser(@Param('id') id: string, @Body() dto: UpdateUserComplianceDto) {
    return this.complianceService.updateUser(id, dto);
  }
}
