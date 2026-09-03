import { ArgsType, Field, Int } from '@nestjs/graphql';
import { z } from 'zod';

/** The page size a client gets when it names none. */
export const DEFAULT_PAGE_SIZE = 10;

/**
 * The largest page this field serves. A request above it is an error rather than a silent clamp:
 * `limit: 500` is nearly always a mistake in the query, and an error surfaces it while the query is
 * being written — instead of leaving it to a comparison of `pageInfo.limit` against what was sent,
 * which is the comparison no client makes.
 */
export const MAX_PAGE_SIZE = 50;

/**
 * The GraphQL half of the contract: the names, `Int`, and the defaults — which GraphQL applies
 * before any pipe runs. Both arguments are therefore optional, and `projectPage { … }` is legal
 * with no arguments at all.
 */
@ArgsType()
export class ProjectPageArgs {
  @Field(() => Int, {
    defaultValue: DEFAULT_PAGE_SIZE,
    description: `How many projects to return: 1 to ${MAX_PAGE_SIZE}.`,
  })
  limit!: number;

  @Field(() => Int, {
    defaultValue: 0,
    description: 'How many projects to skip before this page begins.',
  })
  offset!: number;
}

/**
 * The bounds half. zod rather than class-validator: `ValidationPipe` refuses to run without
 * class-validator and class-transformer, two production dependencies bought to range-check two
 * integers — where this repository already admits every number it reads through zod. See
 * `portSchema` in src/config/namespaces/port.ts, which is the same kind of statement about a port.
 */
export const projectPageSchema = z.object({
  limit: z.number().int().min(1).max(MAX_PAGE_SIZE),
  offset: z.number().int().min(0),
});
