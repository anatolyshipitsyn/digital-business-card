import { registerAs } from '@nestjs/config';
import { z } from 'zod';

import { portSchema } from './port';

// The compose service name and PostgreSQL's own port: the topology this repository ships, in the
// base file and the production overlay alike. Defaults rather than constants so that a database
// somewhere else needs a variable and not a code change — the same bargain DEFAULT_PORT makes in
// common.config.ts.
const DEFAULT_HOST = 'db';
const DEFAULT_PORT = 5432;

// Prisma's own default, written out because a connection string that names its schema is one
// fewer implicit thing when a migration goes wrong.
const SCHEMA = 'public';

// The three credentials take one rule: present and non-empty, and nothing beyond that. What they
// are allowed to contain is not this schema's business — `encodeURIComponent` below is what makes
// any of it safe in a URL.
const credentialSchema = z.string().min(1);

/**
 * What may stand in the host position: a hostname, or an IP literal in the bracketed form a URL
 * takes one in.
 *
 * The host is the one interpolated part that cannot be percent-encoded — encoding it would encode
 * the dots that separate its labels — so it is checked for shape instead of escaped. Left
 * unchecked it was the hole the credentials rule closes for the other three: `POSTGRES_HOST` of
 * `x@evil.host` produced `postgresql://card:card@x@evil.host:5432/card`, and a URL parser reads
 * the *last* `@` as the userinfo delimiter, so the connection and the password it carries went to
 * a host nobody named, silently. `db:5432` was the duller version of the same thing, a second port
 * appended to the authority and a connection error much later that points at the database rather
 * than at the variable.
 */
const hostSchema = z
  .string()
  .regex(
    /^(?:\[[0-9A-Fa-f:.]+\]|[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?)*)$/,
    'must be a hostname or a bracketed IP literal, carrying no port, credentials or path',
  );

/**
 * The PostgreSQL connection, assembled from the same variables the `db` service initialises itself
 * with rather than handed in whole as a `DATABASE_URL`.
 *
 * Assembling it here and not in docker-compose.yml is what allows `encodeURIComponent`. Compose
 * substitutes literally, so a password holding `@`, `:`, `/`, `#` or `?` used to produce a string
 * Prisma parses as a different host and database — a failure that appears only where the password
 * is not `card`, which is to say only in production. Escaping the parts removes the constraint that
 * the deployment password be letters and digits, rather than documenting it.
 *
 * The factory reads each variable through the very schema `databaseSchema` publishes for it, so a
 * variable has one rule and not two: `validate()` in `./index.ts` has already applied it to the
 * environment, and applying it again here is what makes the parsed value the typed one — no cast,
 * and no second parser to drift away from the first.
 */
export const databaseConfig = registerAs('database', () => {
  const user = encodeURIComponent(credentialSchema.parse(process.env.POSTGRES_USER));
  const password = encodeURIComponent(credentialSchema.parse(process.env.POSTGRES_PASSWORD));
  const database = encodeURIComponent(credentialSchema.parse(process.env.POSTGRES_DB));
  const host = hostSchema.parse(process.env.POSTGRES_HOST ?? DEFAULT_HOST);
  const port = portSchema.parse(process.env.POSTGRES_PORT ?? DEFAULT_PORT);

  return {
    url: `postgresql://${user}:${password}@${host}:${port}/${database}?schema=${SCHEMA}`,
  };
});

export const databaseSchema = {
  // Required rather than defaulted. docker-compose.yml passes all three on every start, and it
  // passes the very values the `db` service was initialised with, so the client cannot hold a
  // password the server never got. A default here would reintroduce exactly that: a second set of
  // credentials, which connects successfully to the wrong database instead of failing.
  POSTGRES_USER: credentialSchema,
  POSTGRES_PASSWORD: credentialSchema,
  POSTGRES_DB: credentialSchema,
  // Optional, because their defaults are the topology above. These two are what an explicit
  // DATABASE_URL used to be: they point the client at a database outside the compose network.
  // Pointing it there is not the whole move — the `db` service still starts and `app` still waits
  // for it to report healthy until both are taken out of the compose files.
  //
  // POSTGRES_PORT takes the same rule PORT does, and its bound matters more here: an unusable port
  // does not stop the start at all. It goes into the connection string and comes back much later
  // as a connection error, at the first query, pointing at the database rather than the variable.
  POSTGRES_HOST: hostSchema.optional(),
  POSTGRES_PORT: portSchema.optional(),
};
