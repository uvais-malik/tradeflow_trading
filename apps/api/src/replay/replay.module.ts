import { Module } from '@nestjs/common';
import { ReplayService } from './replay.service';
import { ReplayGateway } from './replay.gateway';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [ReplayService, ReplayGateway],
  exports: [ReplayService],
})
export class ReplayModule {}
