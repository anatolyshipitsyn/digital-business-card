import { Module } from '@nestjs/common';

import { AppConfigModule } from './config/config.module';
import { HealthModule } from './health/health.module';
import { PrismaModule } from './prisma/prisma.module';

// The root module. The config module comes first because it is what validates the environment the
// rest of the application is configured from, and the Prisma module below is configured from it.
// The domain modules and the GraphQL layer above them arrive at M4; PrismaModule is registered
// here in the meantime so that the connection is opened — and a database that cannot be reached is
// reported — while the application is still starting.
@Module({
  imports: [AppConfigModule, HealthModule, PrismaModule],
})
export class AppModule {}
