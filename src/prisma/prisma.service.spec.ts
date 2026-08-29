import { describe, expect, it } from '@jest/globals';

import type { CommonConfigService } from '../config/services/common-config.service';
import type { DatabaseConfigService } from '../config/services/database-config.service';
import { PrismaService } from './prisma.service';

// The client is constructed here but never connects: node-postgres opens sockets lazily and
// nothing below issues a real statement, so an unreachable host in the URL costs nothing. What
// these cases are about is which call `onModuleInit` makes. On Prisma 7 `$connect()` resolves
// against an unresolvable host, a wrong password and a closed port alike, so a bootstrap that only
// calls it reports success for a database that is not there — which is the regression this file
// exists to hold shut.
function build(): { service: PrismaService; queries: string[][] } {
  const database = {
    url: 'postgresql://u:p@nosuchhost.invalid:5432/d?schema=public',
  } as unknown as DatabaseConfigService;
  // `production`, so the constructor does not subscribe to the query log; that subscription is a
  // different decision and not what is under test.
  const common = { environment: 'production' } as unknown as CommonConfigService;

  const service = new PrismaService(database, common);
  const queries: string[][] = [];

  Object.assign(service, {
    $queryRaw: (strings: TemplateStringsArray): Promise<unknown> => {
      queries.push([...strings]);
      return Promise.resolve([{ '?column?': 1 }]);
    },
  });

  return { service, queries };
}

describe('PrismaService', () => {
  it('reaches the database during startup, not merely the client', async () => {
    const { service, queries } = build();

    await service.onModuleInit();

    expect(queries).toEqual([['SELECT 1']]);
  });

  it('propagates a startup failure instead of reporting success', async () => {
    const { service } = build();
    Object.assign(service, {
      $queryRaw: (): Promise<unknown> => Promise.reject(new Error("Can't reach database server")),
    });

    // Nest aborts the bootstrap on a rejected onModuleInit, which is the whole point: the process
    // exits non-zero rather than binding a port in front of a database it cannot read.
    await expect(service.onModuleInit()).rejects.toThrow("Can't reach database server");
  });
});
