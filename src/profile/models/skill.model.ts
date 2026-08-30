import { Field, ObjectType } from '@nestjs/graphql';

/**
 * One entry of «Список навыков». An object type rather than a plain string because the reference
 * query selects `skills { name }` — see "On the reference query as a contract" in
 * docs/requirements/REQUIREMENTS.md.
 */
@ObjectType()
export class Skill {
  @Field()
  name!: string;
}
