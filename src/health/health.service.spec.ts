import { describe, expect, it } from '@jest/globals';
import type {
  HealthCheckResult,
  HealthCheckService,
  HealthIndicatorFunction,
  PrismaHealthIndicator,
} from '@nestjs/terminus';

import type { PrismaService } from '../prisma/prisma.service';
import { HealthService } from './health.service';

// Terminus is not exercised here — its `check` is stubbed to record the indicator list it is
// handed. What these cases are about is which indicators each route asks for, which is the whole
// of the decision: liveness is the answer an orchestrator restarts on, so a database indicator
// landing in that list turns a blip of PostgreSQL into a restart that cannot fix it.
function build(): {
  service: HealthService;
  lists: HealthIndicatorFunction[][];
  pings: [string, unknown][];
  prisma: PrismaService;
} {
  const lists: HealthIndicatorFunction[][] = [];
  const pings: [string, unknown][] = [];

  const health = {
    check: (indicators: HealthIndicatorFunction[]): Promise<HealthCheckResult> => {
      lists.push(indicators);
      return Promise.resolve({ status: 'ok' } as HealthCheckResult);
    },
  } as unknown as HealthCheckService;

  const database = {
    pingCheck: (key: string, client: unknown) => {
      pings.push([key, client]);
      return Promise.resolve({ [key]: { status: 'up' as const } });
    },
  } as unknown as PrismaHealthIndicator;

  const prisma = {} as unknown as PrismaService;

  return { service: new HealthService(health, prisma, database), lists, pings, prisma };
}

describe('HealthService', () => {
  it('asks liveness nothing about the database', async () => {
    const { service, lists, pings } = build();

    await service.liveness();

    // Empty, and it has to stay empty: this is the route the compose healthcheck fetches.
    expect(lists[0]).toHaveLength(0);
    expect(pings).toHaveLength(0);
  });

  it('pings the database on readiness, through the injected client', async () => {
    const { service, lists, pings, prisma } = build();

    await service.readiness();

    expect(lists[0]).toHaveLength(1);
    // The indicator is a thunk, so nothing has run yet — Terminus is what calls it.
    expect(pings).toHaveLength(0);

    await lists[0][0]();

    // The same instance the container injected, not a client this layer constructed for itself.
    expect(pings).toEqual([['database', prisma]]);
  });
});
