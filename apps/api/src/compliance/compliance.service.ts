import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateStockComplianceDto, UpdateUserComplianceDto } from './dto/compliance.dto';

export interface ComplianceEvaluation {
  approved: boolean;
  reason?: string;
}

@Injectable()
export class ComplianceService {
  private readonly logger = new Logger(ComplianceService.name);

  constructor(private prisma: PrismaService) {}

  async getStocks() {
    return this.prisma.stock.findMany({
      orderBy: { symbol: 'asc' }
    });
  }

  async updateStock(id: string, dto: UpdateStockComplianceDto) {
    const stock = await this.prisma.stock.findUnique({ where: { id } });
    if (!stock) throw new NotFoundException('Stock not found');

    return this.prisma.stock.update({
      where: { id },
      data: {
        ...(dto.isRestricted !== undefined && { isRestricted: dto.isRestricted }),
        ...(dto.isTradingHalted !== undefined && { isTradingHalted: dto.isTradingHalted }),
      }
    });
  }

  async getUsers() {
    return this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: { id: true, email: true, fullName: true, role: true, isActive: true, createdAt: true }
    });
  }

  async updateUser(id: string, dto: UpdateUserComplianceDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    return this.prisma.user.update({
      where: { id },
      data: {
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
      select: { id: true, email: true, fullName: true, role: true, isActive: true, createdAt: true }
    });
  }

  async checkCompliance(userId: string, stockId: string): Promise<ComplianceEvaluation> {
    const now = new Date();
    const estHour = now.getUTCHours() - 4; // Simplified EDT offset
    const estMinute = now.getUTCMinutes();
    const timeInHours = estHour + (estMinute / 60);

    // Strict Enforcement! (DISABLED FOR SIMULATOR - 24/7 TRADING ALLOWED)
    const isMarketOpen = true; // timeInHours >= 9.5 && timeInHours < 16.0;
    
    if (!isMarketOpen) {
      return { approved: false, reason: 'Market is currently closed. Trading hours are 9:30 AM to 4:00 PM EST.' };
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return { approved: false, reason: 'User not found.' };
    }
    if (!user.isActive) {
      return { approved: false, reason: 'User account is suspended or pending KYC verification.' };
    }

    const stock = await this.prisma.stock.findUnique({ where: { id: stockId } });
    if (!stock) {
      return { approved: false, reason: 'Invalid security.' };
    }
    if (stock.isTradingHalted) {
      return { approved: false, reason: `Trading is currently halted for ${stock.symbol}.` };
    }
    if (stock.isRestricted) {
      return { approved: false, reason: `${stock.symbol} is on the restricted trading list.` };
    }

    return { approved: true };
  }
}
