import { describe, expect, it } from '@jest/globals';
import { NestFactory } from '@nestjs/core';
import { GraphQLSchemaBuilderModule, GraphQLSchemaFactory } from '@nestjs/graphql';
import type { GraphQLObjectType, GraphQLSchema } from 'graphql';

import { DEFAULT_PAGE_SIZE } from './dto/project-page.args';
import { ProfileResolver } from './profile.resolver';

// The schema is built from the resolver's decorator metadata alone — no application, no Apollo, no
// database. That is enough to hold the one shape everything here is arranged around, and it is not
// a substitute for the end-to-end test this repository still lacks: it proves the contract's shape,
// never that the query returns data.
async function buildSchema(): Promise<GraphQLSchema> {
  const app = await NestFactory.create(GraphQLSchemaBuilderModule, { logger: false });
  await app.init();

  const schema = await app.get(GraphQLSchemaFactory).create([ProfileResolver]);
  await app.close();

  return schema;
}

describe('the generated schema', () => {
  it('keeps projects returning a bare list', async () => {
    // REQ-API-03. The reference query in docs/requirements/ASSIGNMENT.md selects `name` directly
    // on `projects`; the day someone tidies the two fields into one envelope, that query fails on
    // its first selection and the review ends there.
    const profile = (await buildSchema()).getType('Profile') as GraphQLObjectType;

    expect(String(profile.getFields().projects.type)).toBe('[Project!]!');
  });

  it('offers projectPage with both arguments defaulted', async () => {
    const profile = (await buildSchema()).getType('Profile') as GraphQLObjectType;
    const field = profile.getFields().projectPage;

    expect(String(field.type)).toBe('ProjectPage!');
    expect(field.args.map((argument) => [argument.name, argument.defaultValue])).toEqual([
      ['limit', DEFAULT_PAGE_SIZE],
      ['offset', 0],
    ]);
  });
});
