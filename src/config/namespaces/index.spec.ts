import { describe, expect, it } from '@jest/globals';

import { validate } from './index';

// The three the schema requires. docker-compose.yml passes all of them on every start, so a case
// that is about something else still has to carry them.
const CREDENTIALS = {
  POSTGRES_USER: 'card',
  POSTGRES_PASSWORD: 'card',
  POSTGRES_DB: 'card',
};

describe('validate', () => {
  it('accepts the credentials alone, since the rest of the environment is defaulted', () => {
    expect(() => validate({ ...CREDENTIALS })).not.toThrow();
  });

  it('keeps the variables it does not describe', () => {
    // `looseObject`, not a stripping object: what this returns is what ConfigModule goes on to
    // treat as the environment, and PATH and HOME have to survive it.
    expect(validate({ ...CREDENTIALS, PATH: '/usr/bin' })).toMatchObject({ PATH: '/usr/bin' });
  });

  it('names a missing credential rather than letting it arrive as undefined', () => {
    expect(() => validate({ POSTGRES_USER: 'card', POSTGRES_DB: 'card' })).toThrow(
      /POSTGRES_PASSWORD/,
    );
  });

  it('rejects an exported but empty PORT', () => {
    // The hole main.ts used to guard by hand with `Number(…) || …`: `listen('')` binds a random
    // free port and leaves the process looking healthy while nothing answers where it was
    // expected. An empty string coerces to 0 and fails `positive()`.
    expect(() => validate({ ...CREDENTIALS, PORT: '' })).toThrow(/PORT/);
  });

  it('rejects a PORT that is not a whole number', () => {
    expect(() => validate({ ...CREDENTIALS, PORT: '3000.5' })).toThrow(/PORT/);
  });

  it.each([
    ['PORT', { PORT: '99999' }],
    ['POSTGRES_PORT', { POSTGRES_PORT: '99999' }],
  ])('rejects a %s above the highest port there is', (name, overrides) => {
    // `positive()` alone let 99999 through. The application then died on Node's own
    // ERR_SOCKET_BAD_PORT from inside bootstrap() — an unhandled rejection with a stack trace
    // instead of the refusal by name this module exists to give; POSTGRES_PORT went further still
    // and surfaced later as a connection error against a port that cannot exist.
    expect(() => validate({ ...CREDENTIALS, ...overrides })).toThrow(new RegExp(name));
  });

  it.each([
    ['credentials in it', 'x@evil.host'],
    ['a port appended to it', 'db:5432'],
    ['a path appended to it', 'db/card'],
  ])('rejects a POSTGRES_HOST with %s', (_case, host) => {
    // The host cannot be percent-encoded — that would encode the dots between its labels — so it
    // is checked for shape instead. `x@evil.host` is the case that matters: a URL parser takes the
    // last `@` as the userinfo delimiter, so the connection and its password went to a host nobody
    // named, and nothing said so.
    expect(() => validate({ ...CREDENTIALS, POSTGRES_HOST: host })).toThrow(/POSTGRES_HOST/);
  });

  it('accepts the hosts a database is actually reachable at', () => {
    for (const host of ['db', 'managed.example.com', '10.0.0.7', '[::1]']) {
      expect(() => validate({ ...CREDENTIALS, POSTGRES_HOST: host })).not.toThrow();
    }
  });

  it('rejects a NODE_ENV outside the two the repository runs under', () => {
    // A typo here turns Apollo Sandbox off silently, which is REQ-API-01 failing without a
    // message. See "On serving Sandbox in production" in docs/requirements/REQUIREMENTS.md.
    expect(() => validate({ ...CREDENTIALS, NODE_ENV: 'staging' })).toThrow(/NODE_ENV/);
  });

  it('reports every offending variable at once', () => {
    // So that a misconfigured start says everything that is wrong on the first attempt, rather
    // than one variable per restart.
    expect(() => validate({ NODE_ENV: 'staging' })).toThrow(
      /NODE_ENV[\s\S]*POSTGRES_USER[\s\S]*POSTGRES_PASSWORD[\s\S]*POSTGRES_DB/,
    );
  });
});
