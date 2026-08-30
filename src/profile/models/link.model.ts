import { Field, ObjectType } from '@nestjs/graphql';

/** A professional resource: GitHub, LinkedIn or another. `label` is what the client renders. */
@ObjectType()
export class Link {
  @Field()
  label!: string;

  @Field()
  url!: string;
}
