import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { ApolloDriver, type ApolloDriverConfig } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';

/**
 * The GraphQL endpoint, and the three settings that keep Apollo Sandbox reachable in production.
 *
 * Defaults work against REQ-API-01 there: with `NODE_ENV=production` Apollo Server serves its own
 * landing page instead of Sandbox and switches introspection off, and Sandbox cannot build a schema
 * it may not introspect. So all three are named explicitly rather than left to the environment.
 * `playground: false` because the legacy playground is not what the assignment asks for.
 *
 * Introspection stays on deliberately: the reviewer's only way in is the deployed Sandbox, and the
 * schema is read-only. That holds only while no `Mutation` type exists and every resolver returns
 * what is already public on a business card — see "On serving Sandbox in production" in
 * docs/requirements/REQUIREMENTS.md.
 *
 * `autoSchemaFile: true` keeps the generated schema in memory. Written to disk it would be build
 * output in git, which this repository already refuses for src/generated/, or git-ignored and
 * therefore invisible to the reviewer it was meant to serve.
 */
@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
      playground: false,
      introspection: true,
      plugins: [ApolloServerPluginLandingPageLocalDefault({ embed: true })],
    }),
  ],
})
export class AppGraphQLModule {}
