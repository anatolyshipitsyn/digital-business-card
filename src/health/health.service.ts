import { Injectable } from '@nestjs/common';
import { HealthCheckResult, HealthCheckService, PrismaHealthIndicator } from '@nestjs/terminus';

import { PrismaService } from '../prisma/prisma.service';

/**
 * The two questions a probe can ask, kept apart because they have different answers and different
 * consequences for getting them wrong.
 *
 * This layer exists so that the controller holds no handle on the database: `pingCheck` needs the
 * Prisma client itself, and REQ-ARCH-02 puts that in a service rather than in the API layer.
 */
@Injectable()
export class HealthService {
  constructor(
    private readonly health: HealthCheckService,
    private readonly prisma: PrismaService,
    private readonly database: PrismaHealthIndicator,
  ) {}

  /**
   * Liveness: is this process still the one that should be running?
   *
   * The indicator list is empty on purpose. Reaching the handler at all already proves the process
   * is up and the HTTP stack answers, and that is the whole of what a restart decision may rest on.
   * A database query belongs in the readiness check below instead: an unreachable database is not
   * something restarting the application can fix, so it must not reach a probe that restarts it.
   *
   * Compose does not probe this route — Docker never restarts on a failed health check, so there
   * is nothing there for this answer to protect. It is here for an orchestrator that does.
   */
  liveness(): Promise<HealthCheckResult> {
    return this.health.check([]);
  }

  /**
   * Readiness: can this instance serve a request that needs data?
   *
   * `pingCheck` is Terminus' own indicator, so it adds no dependency. On a PostgreSQL datasource it
   * runs `SELECT 1` — it reaches the server rather than the pool, which is what makes it worth
   * asking: on Prisma 7 the driver adapter opens connections lazily, so a client that was
   * constructed successfully proves nothing about the database being there.
   *
   * Failure answers 503 and leaves the process running. That is the intended asymmetry: an
   * unreachable database is a reason to take an instance out of rotation, not a reason to restart
   * it, because restarting fixes nothing that is wrong on the other side of the connection.
   *
   * This is the route `docker-compose.yml` probes, which is why the answer has to be truthful
   * rather than reassuring: it decides what `docker compose ps` reports and what
   * `depends_on: condition: service_healthy` waits for.
   */
  readiness(): Promise<HealthCheckResult> {
    return this.health.check([() => this.database.pingCheck('database', this.prisma)]);
  }
}
