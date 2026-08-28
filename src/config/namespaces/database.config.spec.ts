import { afterEach, beforeEach, describe, expect, it } from '@jest/globals';

import { databaseConfig } from './database.config';

// The factory reads process.env when it is called, so each case starts from an empty environment
// and sets only what it is about. Restoring the original afterwards keeps these cases from
// deciding the result of whatever Jest runs next in the same worker.
const ORIGINAL_ENV = process.env;

beforeEach(() => {
  process.env = {};
});

afterEach(() => {
  process.env = ORIGINAL_ENV;
});

describe('databaseConfig', () => {
  it('percent-encodes each credential it interpolates', () => {
    // The reason the string is assembled here and not in docker-compose.yml. Compose substitutes
    // literally, so this password used to yield a URL Prisma parses as host `ss:w` — a failure
    // that appears only where the password is not `card`, which is to say only in production.
    process.env.POSTGRES_USER = 'us er';
    process.env.POSTGRES_PASSWORD = 'p@ss:w/rd#?';
    process.env.POSTGRES_DB = 'card db';

    expect(databaseConfig().url).toBe(
      'postgresql://us%20er:p%40ss%3Aw%2Frd%23%3F@db:5432/card%20db?schema=public',
    );
  });

  it('defaults the address to the compose service', () => {
    process.env.POSTGRES_USER = 'card';
    process.env.POSTGRES_PASSWORD = 'card';
    process.env.POSTGRES_DB = 'card';

    // `db` and 5432 are the topology docker-compose.yml ships, and the two variables that would
    // override them stay unset on every local start.
    expect(databaseConfig().url).toBe('postgresql://card:card@db:5432/card?schema=public');
  });

  it('moves the database off the compose network when the address is given', () => {
    process.env.POSTGRES_USER = 'card';
    process.env.POSTGRES_PASSWORD = 'card';
    process.env.POSTGRES_DB = 'card';
    process.env.POSTGRES_HOST = 'managed.example.com';
    process.env.POSTGRES_PORT = '6543';

    // These two are what an explicit DATABASE_URL used to be. docker-compose.yml has to list them
    // for the container to receive them at all — Compose passes nothing a service does not name.
    expect(databaseConfig().url).toBe(
      'postgresql://card:card@managed.example.com:6543/card?schema=public',
    );
  });

  it('refuses a host that would move the connection somewhere else', () => {
    // The host is the one part that cannot be percent-encoded, so it is checked for shape. A URL
    // parser takes the *last* `@` as the userinfo delimiter, which is how this used to send the
    // password to `evil.host` while the string still looked like the one above.
    process.env.POSTGRES_USER = 'card';
    process.env.POSTGRES_PASSWORD = 'card';
    process.env.POSTGRES_DB = 'card';
    process.env.POSTGRES_HOST = 'x@evil.host';

    expect(() => databaseConfig()).toThrow();
  });
});
