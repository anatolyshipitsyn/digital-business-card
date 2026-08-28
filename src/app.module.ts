import { Module } from '@nestjs/common';

import { AppConfigModule } from './config/config.module';
import { HealthModule } from './health/health.module';

// The root module. The config module comes first because it is what validates the environment the
// rest of the application is configured from; it gets the Prisma module at M2, then the domain
// modules and the GraphQL layer above them at M4.
@Module({
  imports: [AppConfigModule, HealthModule],
})
export class AppModule {}
