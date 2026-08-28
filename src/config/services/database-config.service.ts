import { Inject, Injectable } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';

import { databaseConfig } from '../namespaces/database.config';

/** Typed access to the `database` namespace; the Prisma module reads it at M2. */
@Injectable()
export class DatabaseConfigService {
  constructor(
    @Inject(databaseConfig.KEY)
    private readonly config: ConfigType<typeof databaseConfig>,
  ) {}

  get url(): string {
    return this.config.url;
  }
}
