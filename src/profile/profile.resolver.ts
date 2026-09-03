import { Args, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';

import { ZodArgsPipe } from '../graphql/zod-args.pipe';
import { ProjectPageArgs, projectPageSchema } from './dto/project-page.args';
import { Experience } from './models/experience.model';
import { Link } from './models/link.model';
import { Profile } from './models/profile.model';
import { Project } from './models/project.model';
import { ProjectPage } from './models/project-page.model';
import { Skill } from './models/skill.model';
import { ProfileService } from './profile.service';

/**
 * The GraphQL surface. It holds no `where`, no `orderBy` and no Prisma type: every question goes to
 * ProfileService, which is what REQ-ARCH-02 is read off.
 *
 * The four collections are field resolvers rather than one `findUnique` with `include`. Neither
 * shape produces an N+1 — the root is a single object — so that is not what decides it;
 * over-fetching is. An `include` loads all four relations on every request, including the reference
 * query, which asks for none of the links and none of the achievements. See "On resolving the
 * relations" in docs/requirements/REQUIREMENTS.md.
 */
@Resolver(() => Profile)
export class ProfileResolver {
  constructor(private readonly profiles: ProfileService) {}

  /**
   * Singular on purpose. Exactly one profile is addressable, so the root is an object rather than a
   * list — see "On the reference query as a contract" in docs/requirements/REQUIREMENTS.md.
   */
  @Query(() => Profile)
  profile(): Promise<Profile> {
    return this.profiles.findDefault();
  }

  @ResolveField(() => [Link])
  links(@Parent() profile: Profile): Promise<Link[]> {
    return this.profiles.findLinks(profile.id);
  }

  @ResolveField(() => [Skill])
  skills(@Parent() profile: Profile): Promise<Skill[]> {
    return this.profiles.findSkills(profile.id);
  }

  /**
   * `experience`, not `experiences`, even though it returns a list: the reference query in
   * ASSIGNMENT.md spells it this way, and the method name is the field name.
   */
  @ResolveField(() => [Experience])
  experience(@Parent() profile: Profile): Promise<Experience[]> {
    return this.profiles.findExperience(profile.id);
  }

  @ResolveField(() => [Project])
  projects(@Parent() profile: Profile): Promise<Project[]> {
    return this.profiles.findProjects(profile.id);
  }

  /**
   * A page of the same rows `projects` returns, beside that field rather than instead of it.
   *
   * `projects` is fixed by the reference query in docs/requirements/ASSIGNMENT.md, which selects
   * `name` directly on it, so it cannot become an envelope without failing REQ-API-03 on the first
   * selection inside it. The redundancy is deliberate and is the cheaper half of the trade.
   *
   * The bounds are applied here and not in the service: a range on `limit` is a rule about a
   * GraphQL argument and has no meaning below this layer.
   */
  @ResolveField(() => ProjectPage)
  projectPage(
    @Parent() profile: Profile,
    @Args(new ZodArgsPipe(projectPageSchema)) args: ProjectPageArgs,
  ): Promise<ProjectPage> {
    return this.profiles.findProjectPage(profile.id, args.limit, args.offset);
  }
}
