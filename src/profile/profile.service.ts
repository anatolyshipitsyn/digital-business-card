import { Injectable } from '@nestjs/common';
import { GraphQLError } from 'graphql';

import { PrismaService } from '../prisma/prisma.service';
import { Experience } from './models/experience.model';
import { Link } from './models/link.model';
import { Profile } from './models/profile.model';
import { Project } from './models/project.model';
import { ProjectPage } from './models/project-page.model';
import { Skill } from './models/skill.model';

/**
 * The business logic of the card: which row is the profile, and in what order each of its
 * collections is returned. The only place in this module that touches the database (REQ-ARCH-02).
 */
@Injectable()
export class ProfileService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * The one profile the API serves.
   *
   * `findUnique` rather than `findFirst`: `isDefault` is `@unique`, so Prisma admits it in
   * `ProfileWhereUniqueInput` and this is a lookup by a key the database enforces — not a filtered
   * scan that happens to return one row today.
   *
   * A missing row is thrown rather than returned as null. The seed guarantees it, so its absence
   * means the database was never prepared, and that should fail loudly rather than answer
   * `{"data": {"profile": null}}` and read as an empty card.
   *
   * A `GraphQLError` rather than Nest's `NotFoundException`: this application answers over a
   * protocol that has no status codes, and Apollo reports an exception it does not recognise as
   * `INTERNAL_SERVER_ERROR` with the HTTP envelope — `status: 404`, `originalError` — attached to
   * the extensions. A client would then read "internal error" for the one thing this can go wrong
   * about. Naming the code is one line and invents no error taxonomy: it stays the only error this
   * layer defines.
   */
  async findDefault(): Promise<Profile> {
    const profile = await this.prisma.profile.findUnique({ where: { isDefault: true } });

    if (!profile) {
      throw new GraphQLError('No profile is marked as the default one.', {
        extensions: { code: 'NOT_FOUND' },
      });
    }

    return profile;
  }

  /**
   * The four collections below are separate reads rather than one `include`, so that a selection
   * loads only what it names — see "On resolving the relations" in
   * docs/requirements/REQUIREMENTS.md.
   *
   * Every one of them orders explicitly. PostgreSQL guarantees no order without an ORDER BY, and
   * the coverage query's response is quoted in the compliance report, so it has to reproduce. Each
   * also breaks ties on a visible column, because the leading key is not unique in any of them:
   * `sortOrder` carries no unique constraint, and two positions can genuinely begin in the same
   * month. Without the tie-breaker those rows would come back in whatever order the plan chose.
   */
  findLinks(profileId: string): Promise<Link[]> {
    return this.prisma.link.findMany({
      where: { profileId },
      orderBy: [{ sortOrder: 'asc' }, { label: 'asc' }],
    });
  }

  findSkills(profileId: string): Promise<Skill[]> {
    return this.prisma.skill.findMany({
      where: { profileId },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  /**
   * Newest first, which is what the two date columns were chosen for (REQ-DATA-07), then by company
   * so that two positions begun in the same month still order the same way on every run.
   */
  findExperience(profileId: string): Promise<Experience[]> {
    return this.prisma.experience.findMany({
      where: { profileId },
      orderBy: [{ startDate: 'desc' }, { company: 'asc' }],
    });
  }

  findProjects(profileId: string): Promise<Project[]> {
    return this.prisma.project.findMany({
      where: { profileId },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  /**
   * One page of the same rows `findProjects` returns.
   *
   * Both reads go inside a single `$transaction`, so `items` and `totalCount` observe one snapshot
   * and cannot disagree about how many rows exist. The table is written only by migration today,
   * which makes that theoretical here — but a total that contradicts its own page is the failure
   * this shape exists to make impossible, not one to leave to the write pattern.
   *
   * Offset pagination is only reproducible over a total order, and this one already is: `sortOrder`
   * carries no unique constraint, but `@@unique([profileId, name])` makes `name` unique within a
   * profile, so `(sortOrder, name)` is distinct for every row of one profile and no third sort key
   * is needed. Delete that constraint and these pages start drifting silently.
   */
  async findProjectPage(profileId: string, limit: number, offset: number): Promise<ProjectPage> {
    const [items, totalCount] = await this.prisma.$transaction([
      this.prisma.project.findMany({
        where: { profileId },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        skip: offset,
        take: limit,
      }),
      this.prisma.project.count({ where: { profileId } }),
    ]);

    return {
      items,
      totalCount,
      pageInfo: { limit, offset, hasNextPage: offset + items.length < totalCount },
    };
  }
}
