import { Module } from '@nestjs/common';

import { HealthModule } from './health/health.module';

// The root module. It gets the Prisma module at M2, then the domain modules and the GraphQL layer
// above them at M4.
@Module({
  imports: [HealthModule],
})
export class AppModule {}
