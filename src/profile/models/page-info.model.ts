import { Field, Int, ObjectType } from '@nestjs/graphql';

/**
 * Where a page sits in the collection it came from. Nothing here is about projects, so the type is
 * generic: a second paged collection would reuse it and only its envelope would stay specific.
 *
 * `limit` and `offset` are echoed rather than assumed known. A client that names neither still has
 * to ask for `offset + limit` next, and it cannot form that sum out of arguments it never sent.
 *
 * There is no `hasPreviousPage`. It is `offset > 0` — no server knowledge whatsoever, so it would
 * be server code existing to save a client an expression.
 */
@ObjectType()
export class PageInfo {
  /** The limit actually applied — the default, when the client named none. */
  @Field(() => Int)
  limit!: number;

  @Field(() => Int)
  offset!: number;

  /**
   * Derivable from the three numbers around it, and kept anyway: it is the value every client
   * computes, and the one every client eventually computes with an off-by-one.
   */
  @Field()
  hasNextPage!: boolean;
}
