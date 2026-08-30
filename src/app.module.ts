import { Module } from '@nestjs/common';

import { AppConfigModule } from './config/config.module';
import { AppGraphQLModule } from './graphql/graphql.module';
import { HealthModule } from './health/health.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProfileModule } from './profile/profile.module';

// The root module. The config module comes first because it is what validates the environment the
// rest of the application is configured from, and the Prisma module below is configured from it.
// PrismaModule is registered here as well as inside ProfileModule so that the connection is opened
// — and a database that cannot be reached is reported — while the application is still starting,
// rather than at the first query.
@Module({
  imports: [AppConfigModule, AppGraphQLModule, HealthModule, PrismaModule, ProfileModule],
})
export class AppModule {}
