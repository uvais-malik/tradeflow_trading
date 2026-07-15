import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        actor: {
          select: { fullName: true, email: true, role: true }
        }
      },
      take: 200, // Limit to 200 for now
    });
  }
}
