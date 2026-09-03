import { describe, expect, it } from '@jest/globals';
import { GraphQLError } from 'graphql';
import { z } from 'zod';

import { ZodArgsPipe } from './zod-args.pipe';

const schema = z.object({ limit: z.number().int().min(1).max(50) });

describe('ZodArgsPipe', () => {
  it('returns the parsed arguments when they satisfy the schema', () => {
    const pipe = new ZodArgsPipe(schema);

    expect(pipe.transform({ limit: 10 })).toEqual({ limit: 10 });
  });

  // The error code is the assertion, not the fact that it threw. Nest's own ValidationPipe throws
  // BadRequestException here, which Apollo does not recognise and reports to the client as
  // INTERNAL_SERVER_ERROR — a test that only checks "it threw" passes on that broken wiring too.
  it('reports a violation as BAD_USER_INPUT rather than an internal error', () => {
    const pipe = new ZodArgsPipe(schema);

    expect.assertions(2);

    try {
      pipe.transform({ limit: 0 });
    } catch (error) {
      expect(error).toBeInstanceOf(GraphQLError);
      expect((error as GraphQLError).extensions.code).toBe('BAD_USER_INPUT');
    }
  });

  it('names the argument it rejected', () => {
    const pipe = new ZodArgsPipe(schema);

    expect(() => pipe.transform({ limit: 51 })).toThrow(/limit/);
  });
});
