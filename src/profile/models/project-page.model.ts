import { Field, Int, ObjectType } from '@nestjs/graphql';

import { PageInfo } from './page-info.model';
import { Project } from './project.model';

/**
 * One page of a profile's projects.
 *
 * It exists beside `Profile.projects` rather than replacing it. The reference query in
 * docs/requirements/ASSIGNMENT.md selects `name` directly on `projects`, so that field cannot
 * become an envelope without failing REQ-API-03 on the first selection inside it. Two fields over
 * one collection is the price of that contract.
 */
@ObjectType()
export class ProjectPage {
  @Field(() => [Project])
  items!: Project[];

  /** Projects on this profile in total, independent of `limit` and `offset`. */
  @Field(() => Int)
  totalCount!: number;

  @Field(() => PageInfo)
  pageInfo!: PageInfo;
}
