import { Field, ObjectType } from '@nestjs/graphql';

/** One project: what it is called, and where it can be seen. */
@ObjectType()
export class Project {
  @Field()
  name!: string;

  @Field()
  url!: string;
}
