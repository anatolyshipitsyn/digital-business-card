import { describe, expect, it } from '@jest/globals';

import type { PrismaService } from '../prisma/prisma.service';
import { ProfileService } from './profile.service';

// Three rows in the order the service asks for. The fake applies skip/take to this list, so the
// tests assert the slice the service requested rather than re-implementing Prisma's ordering.
const rows = [
  { name: 'alpha', url: 'https://example.test/alpha' },
  { name: 'beta', url: 'https://example.test/beta' },
  { name: 'gamma', url: 'https://example.test/gamma' },
];

function build(available = rows): {
  service: ProfileService;
  queries: Record<string, unknown>[];
} {
  const queries: Record<string, unknown>[] = [];

  const prisma = {
    project: {
      findMany: (args: { skip: number; take: number }) => {
        queries.push(args);
        return Promise.resolve(available.slice(args.skip, args.skip + args.take));
      },
      count: () => Promise.resolve(available.length),
    },
    // Running both operations is all the service asks of `$transaction`. What the real client adds
    // is the shared snapshot the two reads observe, which no fake can demonstrate — that claim is
    // carried by the code, not by this test.
    $transaction: (operations: Promise<unknown>[]) => Promise.all(operations),
  } as unknown as PrismaService;

  return { service: new ProfileService(prisma), queries };
}

describe('ProfileService.findProjectPage', () => {
  it('asks for the requested slice, in the curated order', async () => {
    const { service, queries } = build();

    const page = await service.findProjectPage('profile-1', 2, 1);

    expect(page.items.map((project) => project.name)).toEqual(['beta', 'gamma']);
    expect(queries[0]).toMatchObject({
      where: { profileId: 'profile-1' },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      skip: 1,
      take: 2,
    });
  });

  it('reports a further page while rows remain', async () => {
    const { service } = build();

    const page = await service.findProjectPage('profile-1', 2, 0);

    expect(page.totalCount).toBe(3);
    expect(page.pageInfo).toEqual({ limit: 2, offset: 0, hasNextPage: true });
  });

  it('reports no further page once the last row is on it', async () => {
    const { service } = build();

    const page = await service.findProjectPage('profile-1', 2, 2);

    expect(page.items).toHaveLength(1);
    expect(page.pageInfo.hasNextPage).toBe(false);
  });

  it('returns an empty page past the end, with a truthful total', async () => {
    const { service } = build();

    const page = await service.findProjectPage('profile-1', 10, 99);

    expect(page.items).toEqual([]);
    expect(page.totalCount).toBe(3);
    expect(page.pageInfo.hasNextPage).toBe(false);
  });

  it('answers a profile with no projects at all, rather than failing', async () => {
    const { service } = build([]);

    const page = await service.findProjectPage('profile-1', 10, 0);

    expect(page.items).toEqual([]);
    expect(page.totalCount).toBe(0);
    expect(page.pageInfo).toEqual({ limit: 10, offset: 0, hasNextPage: false });
  });
});
