import { Field, GraphQLISODateTime, ObjectType } from '@nestjs/graphql';

/** One position held: company, role, period, and what came out of it. */
@ObjectType()
export class Experience {
  @Field()
  company!: string;

  /** The job title. Unrelated to the `sortOrder` column the sibling tables carry. */
  @Field()
  position!: string;

  /**
   * Two fields rather than one free-text period, so the list sorts by a date instead of a parser.
   * Both name their scalar explicitly: `Date | null` reflects as `Object`, so Nest cannot infer one
   * for `endDate`, and writing it by hand on only that field would leave the pair looking
   * inconsistent for a reason nobody would remember.
   */
  @Field(() => GraphQLISODateTime)
  startDate!: Date;

  /** Null is the current position — no sentinel string for a client to compare against. */
  @Field(() => GraphQLISODateTime, { nullable: true })
  endDate!: Date | null;

  @Field(() => [String])
  achievements!: string[];
}
