import { registerAs } from '@nestjs/config';

import { buildDatabaseUrl, credentialSchema, hostSchema } from './database-url';
import { portSchema } from './port';

/**
 * The PostgreSQL connection, as the application's `database` namespace.
 *
 * The assembly itself is in `./database-url.ts`, which the Prisma CLI reads too — see the note
 * there. What this file adds is the namespace: the factory the container loads, and the rules
 * `validate()` in `./index.ts` applies to the environment before it runs.
 */
export const databaseConfig = registerAs('database', () => ({
  url: buildDatabaseUrl(),
}));

export const databaseSchema = {
  // Required rather than defaulted. docker-compose.yml passes all three on every start, and it
  // passes the very values the `db` service was initialised with, so the client cannot hold a
  // password the server never got. A default here would reintroduce exactly that: a second set of
  // credentials, which connects successfully to the wrong database instead of failing.
  POSTGRES_USER: credentialSchema,
  POSTGRES_PASSWORD: credentialSchema,
  POSTGRES_DB: credentialSchema,
  // Optional, because their defaults are the topology `database-url.ts` writes down. These two are
  // what an explicit DATABASE_URL used to be: they point the client at a database outside the
  // compose network. Pointing it there is not the whole move — the `db` service still starts and
  // `app` still waits for it to report healthy until both are taken out of the compose files.
  //
  // POSTGRES_PORT takes the same rule PORT does, and its bound matters more here: an unusable port
  // does not stop the start at all. It goes into the connection string and comes back much later
  // as a connection error, at the first query, pointing at the database rather than the variable.
  POSTGRES_HOST: hostSchema.optional(),
  POSTGRES_PORT: portSchema.optional(),
};
