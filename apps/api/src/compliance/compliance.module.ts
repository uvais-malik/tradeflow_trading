import { Module } from '@nestjs/common';
import { ComplianceService } from './compliance.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ComplianceController } from './compliance.controller';

@Module({
  imports: [PrismaModule],
  controllers: [ComplianceController],
  providers: [ComplianceService],
  exports: [ComplianceService],
})
export class ComplianceModule {}
