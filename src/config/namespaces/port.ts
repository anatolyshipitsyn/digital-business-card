import { z } from 'zod';

/**
 * The rule both ports in this application are admitted by: `PORT` in common.config.ts and
 * `POSTGRES_PORT` in database-url.ts.
 *
 * It is written once rather than twice, and it lives here rather than in either namespace, because
 * neither of those two owns it — a port is a 16-bit number, which is a fact about TCP and not a
 * decision this repository takes. Coerced, because everything in process.env is a string.
 */
export const portSchema = z.coerce.number().int().positive().max(65535);
