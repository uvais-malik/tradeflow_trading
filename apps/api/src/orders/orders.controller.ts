import { Controller, Get, Post, Body, Param, Patch } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto, UpdateOrderDto } from './dto/create-order.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('orders')
@ApiBearerAuth()
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  async createOrder(@CurrentUser() user: any, @Body() createOrderDto: CreateOrderDto) {
    return this.ordersService.createOrder(user.userId, createOrderDto);
  }

  @Get()
  async getOrders(@CurrentUser() user: any) {
    return this.ordersService.getOrders(user.userId);
  }

  @Get('executions')
  async getExecutions(@CurrentUser() user: any) {
    return this.ordersService.getExecutions(user.userId);
  }

  @Get('executions/csv')
  async getExecutionsCsv(@CurrentUser() user: any) {
    const executions = await this.ordersService.getExecutions(user.userId);
    let csv = 'Trade ID,Symbol,Side,Quantity,Price,Timestamp\n';
    
    for (const exec of executions) {
      const side = exec.buyOrderId === exec.id ? 'BUY' : 'SELL';
      csv += `${exec.id},${exec.stock.symbol},${side},${exec.quantity},${exec.price},${exec.executedAt}\n`;
    }
    return csv;
  }

  @Patch(':id/cancel')
  async cancelOrder(@CurrentUser() user: any, @Param('id') id: string) {
    return this.ordersService.cancelOrder(user.userId, id);
  }

  @Patch(':id')
  async modifyOrder(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() updateOrderDto: UpdateOrderDto,
  ) {
    return this.ordersService.modifyOrder(user.userId, id, updateOrderDto);
  }
}
