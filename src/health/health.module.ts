import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';

import { PrismaModule } from '../prisma/prisma.module';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

// PrismaModule is imported rather than inherited: it is deliberately not `@Global()`, so a module
// that reaches the database says so here, where a review can see it.
@Module({
  imports: [TerminusModule, PrismaModule],
  controllers: [HealthController],
  providers: [HealthService],
})
export class HealthModule {}
