import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService, HealthCheckResult } from '@nestjs/terminus';

@Controller('health')
export class HealthController {
  constructor(private readonly health: HealthCheckService) {}

  // The indicator list is empty on purpose: reaching this handler already proves the process is up
  // and the HTTP stack answers, which is what a container probe should assert. From M2 it gains a
  // `PrismaHealthIndicator` — Terminus ships one, so that costs no further dependency.
  @Get()
  @HealthCheck()
  check(): Promise<HealthCheckResult> {
    return this.health.check([]);
  }
}
