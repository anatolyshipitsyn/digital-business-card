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
export const credentialSchema = z.string().min(1);

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
export const hostSchema = z
  .string()
  .regex(
    /^(?:\[[0-9A-Fa-f:.]+\]|[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?)*)$/,
    'must be a hostname or a bracketed IP literal, carrying no port, credentials or path',
  );

/**
 * The PostgreSQL connection string, assembled from the `POSTGRES_*` variables rather than handed
 * in whole as a `DATABASE_URL`.
 *
 * Assembling it here and not in docker-compose.yml is what allows `encodeURIComponent`. Compose
 * substitutes literally, so a password holding `@`, `:`, `/`, `#` or `?` used to produce a string
 * Prisma parses as a different host and database — a failure that appears only where the password
 * is not `card`, which is to say only in production. Escaping the parts removes the constraint that
 * the deployment password be letters and digits, rather than documenting it.
 *
 * It lives in a file of its own, apart from the `registerAs` factory that wraps it, because two
 * processes need it and only one of them is the application. `prisma.config.ts` gives the Prisma
 * CLI the same string the application connects with, and importing it from here costs the CLI's
 * own TypeScript loader nothing but zod — where importing the namespace would pull in
 * `@nestjs/config`, and with it the container the CLI has no reason to build.
 */
export function buildDatabaseUrl(): string {
  const user = encodeURIComponent(credentialSchema.parse(process.env.POSTGRES_USER));
  const password = encodeURIComponent(credentialSchema.parse(process.env.POSTGRES_PASSWORD));
  const database = encodeURIComponent(credentialSchema.parse(process.env.POSTGRES_DB));
  const host = hostSchema.parse(process.env.POSTGRES_HOST ?? DEFAULT_HOST);
  const port = portSchema.parse(process.env.POSTGRES_PORT ?? DEFAULT_PORT);

  return `postgresql://${user}:${password}@${host}:${port}/${database}?schema=${SCHEMA}`;
}
