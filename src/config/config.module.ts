import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { configs, validate } from './namespaces';
import { CommonConfigService } from './services/common-config.service';
import { DatabaseConfigService } from './services/database-config.service';

/**
 * The one place the environment is read.
 *
 * `load` registers the namespace factories and `validate` checks the whole environment against
 * the zod schema while the module initialises — so a missing `POSTGRES_PASSWORD` or a mistyped
 * `NODE_ENV` stops the process during bootstrap, with a message naming the variable, rather than
 * surfacing as an `undefined` somewhere later.
 *
 * `ignoreEnvFile`, because nothing here parses `.env`: Compose is what reads that file,
 * substituting the values into docker-compose.yml, and the container receives them as process
 * environment variables. A second reader in the application would give the same names two sets of
 * defaults, and the two would eventually disagree.
 *
 * Global, so that the typed services are injectable without every module importing this one — the
 * same reason `ConfigModule` itself is registered with `isGlobal`.
 */
@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      ignoreEnvFile: true,
      load: configs,
      validate,
    }),
  ],
  providers: [CommonConfigService, DatabaseConfigService],
  exports: [CommonConfigService, DatabaseConfigService],
})
export class AppConfigModule {}
