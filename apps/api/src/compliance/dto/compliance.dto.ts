import { IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateStockComplianceDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isRestricted?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isTradingHalted?: boolean;
}

export class UpdateUserComplianceDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
