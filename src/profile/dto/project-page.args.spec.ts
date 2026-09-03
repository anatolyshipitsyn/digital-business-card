import { describe, expect, it } from '@jest/globals';
import { GraphQLError } from 'graphql';

import { ZodArgsPipe } from '../../graphql/zod-args.pipe';
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, projectPageSchema } from './project-page.args';

// Driven through the pipe rather than through `safeParse` directly, so what the cases assert is
// what a client actually receives.
const pipe = new ZodArgsPipe(projectPageSchema);

describe('projectPageSchema', () => {
  it('admits the defaults GraphQL applies when the client names neither argument', () => {
    expect(pipe.transform({ limit: DEFAULT_PAGE_SIZE, offset: 0 })).toEqual({
      limit: DEFAULT_PAGE_SIZE,
      offset: 0,
    });
  });

  it('admits both ends of the accepted range', () => {
    expect(pipe.transform({ limit: 1, offset: 0 })).toEqual({ limit: 1, offset: 0 });
    expect(pipe.transform({ limit: MAX_PAGE_SIZE, offset: 7 })).toEqual({
      limit: MAX_PAGE_SIZE,
      offset: 7,
    });
  });

  it.each([
    ['a limit of nothing', { limit: 0, offset: 0 }],
    ['a limit past the ceiling', { limit: MAX_PAGE_SIZE + 1, offset: 0 }],
    ['a negative offset', { limit: DEFAULT_PAGE_SIZE, offset: -1 }],
  ])('rejects %s as BAD_USER_INPUT', (_case, args) => {
    expect.assertions(2);

    try {
      pipe.transform(args);
    } catch (error) {
      expect(error).toBeInstanceOf(GraphQLError);
      expect((error as GraphQLError).extensions.code).toBe('BAD_USER_INPUT');
    }
  });
});
