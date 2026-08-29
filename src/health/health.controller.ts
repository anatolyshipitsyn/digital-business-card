import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckResult } from '@nestjs/terminus';

import { HealthService } from './health.service';

@Controller('health')
export class HealthController {
  constructor(private readonly health: HealthService) {}

  // Both questions are named, neither is the default: a bare `/health` would have to answer one of
  // them and would be read as the other, so the unqualified path 404s rather than guessing.
  // Nothing probes this one here — Docker does not restart on a failed health check — but it is
  // what an orchestrator that does should be pointed at.
  @Get('liveness')
  @HealthCheck()
  liveness(): Promise<HealthCheckResult> {
    return this.health.liveness();
  }

  // This is the one docker-compose.yml probes: reaching the database is what makes the container
  // worth depending on. Why it is a separate route rather than a second indicator on the one
  // above, is in health.service.ts.
  @Get('readiness')
  @HealthCheck()
  readiness(): Promise<HealthCheckResult> {
    return this.health.readiness();
  }
}
