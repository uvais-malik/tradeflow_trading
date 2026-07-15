import { IsString, IsNumber, IsEnum, Min, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { OrderSide, OrderType, OrderValidity } from '@prisma/client';

export class CreateOrderDto {
  @ApiProperty()
  @IsString()
  stockId: string;

  @ApiProperty({ enum: OrderSide })
  @IsEnum(OrderSide)
  side: OrderSide;

  @ApiProperty({ enum: OrderType })
  @IsEnum(OrderType)
  orderType: OrderType;

  @ApiProperty({ enum: OrderValidity })
  @IsEnum(OrderValidity)
  validity: OrderValidity;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  price: number;
}

export class UpdateOrderDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  quantity?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;
}
