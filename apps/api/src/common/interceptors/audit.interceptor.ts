import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(private prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, user, ip, body } = request;

    // Only audit authenticated routes
    if (!user) {
      return next.handle();
    }

    return next.handle().pipe(
      tap(() => {
        // Fire and forget logging
        this.prisma.auditLog.create({
          data: {
            actorId: user.userId || user.id,
            action: `${method} ${url}`,
            entityType: 'HTTP_REQUEST',
            entityId: ip || 'unknown_ip',
            metadata: body ? body : {},
          }
        }).catch(err => {
          this.logger.error(`Failed to write audit log: ${err.message}`);
        });
      }),
    );
  }
}
