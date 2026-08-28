import { registerAs } from '@nestjs/config';
import { z } from 'zod';

import { portSchema } from './port';

// The local default, and the one .env.example documents. It sits here rather than in main.ts so
// that the value and the rule that admits it live in the same file.
const DEFAULT_PORT = 3000;

// The two values this repository runs under, written once: the rule that admits NODE_ENV and the
// type the rest of the application sees are then the same statement, and adding a third value is
// one edit rather than two that can disagree.
const environmentSchema = z.enum(['development', 'production']);

/** `development` or `production` — what NODE_ENV is allowed to be. */
export type Environment = z.infer<typeof environmentSchema>;

/**
 * How the process presents itself: the environment tag it runs under, and the port the HTTP
 * server binds to.
 *
 * Each variable is read through the very schema `commonSchema` publishes for it. `validate()` in
 * `./index.ts` has already applied those rules to the environment before this factory runs;
 * applying them again here is what turns the string into the typed value, so the union and the
 * number are parsed rather than asserted and there is no second parser to drift from the first.
 */
export const commonConfig = registerAs('common', () => ({
  environment: environmentSchema.parse(process.env.NODE_ENV ?? 'development'),
  port: portSchema.parse(process.env.PORT ?? DEFAULT_PORT),
}));

export const commonSchema = {
  // Only the two values this repository runs under: docker-compose.yml sets `development`,
  // docker-compose.prod.yml sets `production`, and Apollo reads the same variable to decide
  // whether it serves Sandbox — see "On serving Sandbox in production" in
  // docs/requirements/REQUIREMENTS.md. A third value would almost always be a typo, and a typo
  // there turns Sandbox off silently, which is REQ-API-01 failing without a message.
  NODE_ENV: environmentSchema.optional(),
  // `portSchema` is what closes the hole main.ts used to guard by hand: an exported but empty PORT
  // coerces to 0 and fails, where `listen('')` binds a random free port and leaves the process
  // looking healthy while nothing answers where it was expected. Its upper bound closes the other
  // end of the same hole — 99999 passed validation and died later on Node's own
  // ERR_SOCKET_BAD_PORT, a stack trace out of bootstrap() rather than a refusal naming PORT.
  PORT: portSchema.optional(),
};
