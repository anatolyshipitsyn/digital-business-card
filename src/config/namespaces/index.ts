import { z } from 'zod';

import { commonConfig, commonSchema } from './common.config';
import { databaseConfig, databaseSchema } from './database.config';

/** The namespace factories handed to `ConfigModule.forRoot({ load })`. */
export const configs = [commonConfig, databaseConfig];

/**
 * Every variable the application reads, in one schema.
 *
 * `looseObject` keeps the rest of `process.env` — PATH, HOME, the dozen Docker adds — rather than
 * stripping it: what this returns is what ConfigModule goes on to treat as the environment.
 */
const validationSchema = z.looseObject({
  ...commonSchema,
  ...databaseSchema,
});

/**
 * The validator for `ConfigModule.forRoot({ validate })`.
 *
 * Failing here is the point: the process dies during bootstrap, before the port is bound and
 * before the container can report healthy, instead of carrying an `undefined` into the first
 * request. Every problem is listed at once, so a misconfigured start says everything that is
 * wrong on the first attempt rather than one variable per restart.
 */
export function validate(config: Record<string, unknown>): Record<string, unknown> {
  const result = validationSchema.safeParse(config);

  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`)
      .join('\n');

    throw new Error(`Invalid environment variables:\n${issues}`);
  }

  return result.data;
}
