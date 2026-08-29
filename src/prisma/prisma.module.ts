import { Module } from '@nestjs/common';

import { PrismaService } from './prisma.service';

/**
 * The data access layer, as a module.
 *
 * Deliberately not `@Global()`: the config module is global because every layer legitimately reads
 * configuration, while database access is exactly what REQ-ARCH-02 asks to be reachable from one
 * place. A module that wants the database imports this one and says so, which makes a resolver
 * reaching for Prisma a visible change to a module's imports rather than an injection nobody sees.
 */
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
