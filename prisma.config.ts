import { defineConfig } from 'prisma/config';

import { buildDatabaseUrl } from './src/config/namespaces/database-url';

// The three variables that describe a database at all. The application requires them; the CLI
// cannot, because one of its commands runs where they do not exist.
const CREDENTIALS = ['POSTGRES_USER', 'POSTGRES_PASSWORD', 'POSTGRES_DB'] as const;

/**
 * The Prisma CLI's view of this project: where the schema and the migrations are, and what to
 * connect to.
 *
 * The connection string is built by the application's own assembly
 * (`src/config/namespaces/database-url.ts`) rather than read from a `DATABASE_URL`, so `migrate
 * deploy` and the running application cannot end up pointing at different databases — and the
 * password is percent-encoded on both paths, not only one. Nothing here reads `.env`: Compose
 * substitutes that file and passes process environment variables, and the CLI runs through the
 * `app` service, which receives the same ones the application does.
 *
 * `datasource` is left out entirely when the environment names no database. The one command that
 * legitimately runs without credentials is `prisma generate` in the Docker build stage, which
 * connects to nothing; requiring them there would mean inventing a throwaway password for the
 * image build. A *partial* environment is not that case and still fails by name, because
 * `buildDatabaseUrl` runs as soon as any of the three is set.
 */
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: CREDENTIALS.some((name) => process.env[name] !== undefined)
    ? { url: buildDatabaseUrl() }
    : undefined,
});
