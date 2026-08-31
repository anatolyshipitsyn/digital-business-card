# Digital Business Card

A backend that presents me as a specialist: a GraphQL API over NestJS and Prisma, browsable in
Apollo Sandbox. Ask it for my profile and it returns the profile together with my skills, work
experience and projects.

Built with TypeScript, NestJS, Prisma, GraphQL, PostgreSQL and Docker.

## Running it

```bash
docker compose up --build
```

## GraphQL Sandbox

- Deployed: https://card-stg.shipicin.ru/graphql
- Local: http://localhost:3000/graphql

Paste a query into Sandbox and run it — the profile, skills, work experience and projects come back
in one response.

## What was built, and why

The assignment this implements is preserved verbatim in
[`docs/requirements/ASSIGNMENT.md`](docs/requirements/ASSIGNMENT.md). The numbered requirements
derived from it, and the reasoning behind the design decisions, are in
[`docs/requirements/REQUIREMENTS.md`](docs/requirements/REQUIREMENTS.md). The project goal, stack and
working rules are in [`AGENTS.md`](AGENTS.md). The order the work is built in, and what closes
each milestone, are in [`ROADMAP.md`](ROADMAP.md).
