import { Field, ObjectType } from '@nestjs/graphql';

/**
 * The card. `name` and `description` are its own columns; the four collections are field resolvers
 * on ProfileResolver, so a selection loads only what it names.
 *
 * The audit columns every table carries — `createdAt` and `updatedAt` — are deliberately not fields
 * here or on any sibling type, for the same reason `sortOrder` is not one: they are how a row is
 * administered, not something the card says about me. See "On the audit timestamps" in
 * docs/requirements/REQUIREMENTS.md.
 */
@ObjectType()
export class Profile {
  /**
   * Deliberately not a `@Field`. Only decorated properties reach the generated schema, so the id
   * stays out of the API while remaining on the object the field resolvers receive as their
   * parent — which is how they reach this profile's collections without importing a Prisma type.
   */
  id!: string;

  @Field()
  name!: string;

  @Field()
  description!: string;
}
