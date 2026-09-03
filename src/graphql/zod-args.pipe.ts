import { Injectable, type PipeTransform } from '@nestjs/common';
import { GraphQLError } from 'graphql';
import type { ZodType } from 'zod';

/**
 * Applies a zod schema to a resolver's arguments, and reports a violation the way GraphQL reports
 * things: a `GraphQLError` carrying `code: BAD_USER_INPUT`.
 *
 * Nest's own `ValidationPipe` is not used, for two reasons. It refuses to run without
 * `class-validator` and `class-transformer` — two production dependencies bought to range-check
 * integers, where this repository already admits every number it reads through zod. And it throws
 * `BadRequestException`, which Apollo does not recognise: that arrives at the client as
 * `INTERNAL_SERVER_ERROR` with the HTTP envelope in the extensions, so a caller reads "internal
 * error" for its own typo. `ProfileService.findDefault` documents the same trap at the other end
 * of the request.
 *
 * The pipe holds a schema rather than a field, so it belongs here rather than in a feature module.
 */
@Injectable()
export class ZodArgsPipe<T> implements PipeTransform<unknown, T> {
  constructor(private readonly schema: ZodType<T>) {}

  transform(value: unknown): T {
    const result = this.schema.safeParse(value);

    if (result.success) {
      return result.data;
    }

    // Named, because an unnamed range error sends the caller looking through every argument. The
    // path is mapped through String() rather than joined directly: zod types it as PropertyKey[].
    const detail = result.error.issues
      .map((issue) => `${issue.path.map(String).join('.') || '(root)'}: ${issue.message}`)
      .join('; ');

    throw new GraphQLError(detail, { extensions: { code: 'BAD_USER_INPUT' } });
  }
}
