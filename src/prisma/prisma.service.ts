import { Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';

import { CommonConfigService } from '../config/services/common-config.service';
import { DatabaseConfigService } from '../config/services/database-config.service';
import { PrismaClient } from '../generated/prisma/client';

/**
 * The options the client below is constructed with, written as a type because the generated client
 * reads its own event levels off them: `$on` accepts exactly the levels `log` declares as events,
 * so the literal `'query'` here is what makes the listener in the constructor typed — and asking
 * for a level that was never configured a compile error rather than a callback that never fires.
 */
type ClientOptions = {
  adapter: PrismaPg;
  log: [{ emit: 'event'; level: 'query' }];
};

/**
 * The data access layer's one connection to PostgreSQL, and the only place the generated Prisma
 * client is constructed.
 *
 * Nothing above the domain services injects this: resolvers reach services, services reach this
 * (REQ-ARCH-02). What it owns is the connection lifecycle — opening the pool when the container
 * starts and closing it when the container is torn down — and the query log the nested-data claim
 * is read off.
 */
@Injectable()
export class PrismaService
  extends PrismaClient<ClientOptions>
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor(database: DatabaseConfigService, common: CommonConfigService) {
    super({
      // Prisma 7 connects through a driver adapter rather than a URL on the client: the Rust query
      // engine is gone, so the client hands SQL to node-postgres and the pool is that driver's.
      // The connection string is the application's own — assembled and percent-encoded in
      // src/config/namespaces/database-url.ts — which is the same string prisma.config.ts gives
      // the CLI, so `migrate deploy` and the running application cannot address different
      // databases.
      adapter: new PrismaPg({ connectionString: database.url }),
      // Emitted as an event rather than written to stdout, so that what is logged, and whether
      // anything is, is decided below rather than by the client.
      log: [{ emit: 'event', level: 'query' }],
    });

    // REQ-EVAL-03 is evidenced by a statement count: the claim is that the number of queries the
    // GraphQL layer emits does not grow with the number of rows underneath it, and the only way to
    // read that off a running application is to see the statements. Hence the log, and hence it
    // being here rather than in the GraphQL module — it is a property of the data access layer.
    //
    // Development only. In production these lines would be one write per statement per request, on
    // an application whose entire payload is a single profile; and their parameters are that
    // profile's data, which has no business being duplicated into a log. `debug` for the same
    // reason: this is evidence for a person watching, not an operational record.
    if (common.environment === 'development') {
      this.$on('query', ({ duration, query }) => {
        this.logger.debug(`${String(duration)}ms  ${query}`);
      });
    }
  }

  /**
   * Reach the database while the container is still starting, so that an unreachable one fails the
   * bootstrap rather than the first request.
   *
   * `$connect()` is not what does this on Prisma 7. The Rust query engine is gone and the driver
   * adapter opens connections lazily, so `$connect()` resolves against an unresolvable host, a
   * wrong password and a closed port alike — the application then starts, binds its port, and the
   * failure surfaces as an error on the reviewer's first query. A statement is the cheapest thing
   * that cannot resolve without a server on the other end, so the gate is a statement.
   *
   * A rejection here aborts the Nest bootstrap and the process exits non-zero, which is what
   * REQ-INIT-01's negative case asks for where no orchestrator gates startup.
   */
  async onModuleInit(): Promise<void> {
    await this.$queryRaw`SELECT 1`;
  }

  /**
   * Close the pool on shutdown. This is what `enableShutdownHooks()` in src/main.ts exists for:
   * without it the process exits with sockets open and PostgreSQL logs the disconnection as
   * abnormal.
   */
  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
