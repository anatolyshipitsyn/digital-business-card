import { afterEach, beforeEach, describe, expect, it } from '@jest/globals';

import { commonConfig } from './common.config';

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

describe('commonConfig', () => {
  it('falls back to the development defaults when neither variable is set', () => {
    // The state every local `docker compose up` starts from with no .env present.
    expect(commonConfig()).toEqual({ environment: 'development', port: 3000 });
  });

  it('hands out PORT as a number, not the string the environment holds', () => {
    // The reason the factory parses rather than casts: `listen()` and every later consumer get a
    // number, and the rule that produced it is the same one validate() applied.
    process.env.PORT = '4000';

    expect(commonConfig().port).toBe(4000);
  });

  it('reads the environment tag Apollo branches on', () => {
    process.env.NODE_ENV = 'production';

    expect(commonConfig().environment).toBe('production');
  });

  it('refuses a value validate() would have refused, rather than casting it through', () => {
    // Unreachable in the running application — validate() has already stopped the process — but
    // it is what keeps the factory and the schema one rule instead of a rule and a cast beside it.
    process.env.NODE_ENV = 'staging';

    expect(() => commonConfig()).toThrow();
  });
});
