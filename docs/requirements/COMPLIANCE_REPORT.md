# Compliance Report

One section per requirement ID, in the order [`REQUIREMENTS.md`](./REQUIREMENTS.md) numbers them.
Each quotes the assignment verbatim from [`ASSIGNMENT.md`](./ASSIGNMENT.md), then carries its
evidence: a command with what it printed, a `file:line`, or a GraphQL response. Cuts in pasted
output are marked `[…]`; nothing is reordered or retyped.

Unless a section says otherwise, evidence was produced on 2026-08-31 from a clean clone of the
repository at `15d4e8a` — `git clone` into an empty directory, no `.env`, its own Compose project so
the run had volumes of its own.

Three runs are cited throughout:

- **Run A** — the development stack, the command the README gives a reviewer: `docker compose up --build`.
- **Run B** — the same clone under the production overlay: `docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build --wait`, with `POSTGRES_USER`, `POSTGRES_PASSWORD` and `POSTGRES_DB` supplied. The password held `@ : / # ?` on purpose.
- **Run C** — the deployed instance: the `deploy` workflow's run on the self-hosted runner from `staging` at `a1a4ba7`, and the requests made to the public address afterwards. This is the one run that is not the clean clone above. Only REQ-DELIV-01 and REQ-DELIV-02 cite it.

---

## REQ-STACK

### REQ-STACK-01 — ✅ Met

> Создайте Вашу цифровую визитку (backend-приложение), которая презентует Вас как специалиста, с обязательным использованием следующих технологий:
>
> - Git;

**Implementation:** the repository is developed in Git, one commit per meaningful change.
**Evidence:**

```
$ git log --oneline
a1a4ba7 docs: record the M6 decisions
25afbd7 docs: give the README its start command and its links
48da864 ci: deploy to the host from a self-hosted runner
15d4e8a docs: close M5
7316b5f docs: record the M5 decisions
f7f38e5 refactor: stop exporting the validation schema
07f2e0c docs: record the M4 decisions
335dfe3 feat: serve the profile and its collections over GraphQL
103c269 feat: add the addressing flag, sort order and audit columns
ed5a7dc docs: record the M3 decisions
046730f feat: apply the migration queue from the image entrypoint
c3b77d7 feat: seed the profile and its collections in a data migration
1ac984d docs: record the M2 decisions
dc3eeb0 feat: report database reachability on a readiness route
dde9657 feat: own the database connection in a Prisma module
81a3f5b feat: model the profile, its links, skills, experience and projects in Prisma
ea5f49e feat: read the environment through a validated config module
4565474 docs: drop the interim compliance report
315ea9c docs: record the M1 decisions and an interim compliance report
49d1336 feat: run the application and PostgreSQL under Docker Compose
6ce2bb6 feat: bootstrap the NestJS application behind a health route
318496e docs: describe the project in the README
9667dac chore: declare the environment contract and the ignore rules
0bb82b4 docs: add the agent guide and the build roadmap
b052a32 docs: record the assignment and derive numbered requirements
c4f3710 Initial commit
```

26 commits, read at `a1a4ba7` — the commit this report was written against. The commits that add
the report itself follow it and are not in the excerpt above; the requirement is about how the
history is kept, not about its length on any given day. The checkpoint-style messages it rules out
are absent:

```
$ git log --oneline | grep -icE "^[0-9a-f]+ (wip|fix|update)$"
0
```

### REQ-STACK-02 — ✅ Met

> - TypeScript;

**Implementation:** every source file is `.ts`; `strict` is on.
**Evidence:**

```
$ find src prisma -name "*.js" -not -path "*/node_modules/*" | head
$ echo "js files above (expect none)"
js files above (expect none)
```

```
$ grep -n '"strict"' tsconfig.json
22:    "strict": true
```

`src/` holds 29 `.ts` files outside the generated client; `prisma/` holds `schema.prisma` and the
`.sql` migrations, which the requirement's own wording exempts.

### REQ-STACK-03 — ✅ Met

> - Node.js;

**Implementation:** `package.json:7-9` declares the floor; `Dockerfile:11` pins the base image.
**Evidence:**

```
$ docker compose -f docker-compose.yml -f docker-compose.prod.yml exec -T app node -v
v22.22.3

$ grep -n -A2 '"engines"' package.json
7:  "engines": {
8-    "node": ">=22.12.0"
9-  },
```

```
$ grep -n "^FROM" Dockerfile
11:FROM node:22.22-slim AS base
29:FROM base AS deps
36:FROM deps AS dev
66:FROM deps AS build
84:FROM base AS runtime
```

The version inside the running container is read from Run B — the image that gets deployed, not the
development stage.

### REQ-STACK-04 — ✅ Met

> - NestJS;

**Implementation:** `src/main.ts:7` bootstraps `AppModule`; `src/app.module.ts:15` composes the five
feature modules.
**Evidence:**

```
$ grep -n "NestFactory\|bootstrap\|listen" src/main.ts
1:import { NestFactory } from '@nestjs/core';
6:async function bootstrap(): Promise<void> {
7:  const app = await NestFactory.create(AppModule);
25:  await app.listen(app.get(CommonConfigService).port);
28:void bootstrap();

$ grep -n "imports:" src/app.module.ts
15:  imports: [AppConfigModule, AppGraphQLModule, HealthModule, PrismaModule, ProfileModule],
```

The framework is visible in the running application's own startup log (Run A):

```
app-1  | [Nest] LOG [InstanceLoader] GraphQLModule dependencies initialized
app-1  | [Nest] LOG [RouterExplorer] Mapped {/health/readiness, GET} route
app-1  | [Nest] LOG [GraphQLModule] Mapped {/graphql, POST} route
app-1  | [Nest] LOG [NestApplication] Nest application successfully started
```

### REQ-STACK-05 — ✅ Met

> - Prisma;

**Implementation:** `prisma/schema.prisma` defines the model; `src/prisma/prisma.service.ts:29` owns
the client and its connection lifecycle.
**Evidence:**

```
$ grep -nE "^model |@relation|@@index|@@unique" prisma/schema.prisma
36:model Profile {
80:model Link {
92:  profile   Profile @relation(fields: [profileId], references: [id], onDelete: Cascade)
98:  @@unique([profileId, url])
102:model Skill {
113:  profile   Profile @relation(fields: [profileId], references: [id], onDelete: Cascade)
115:  @@unique([profileId, name])
119:model Experience {
140:  profile   Profile @relation(fields: [profileId], references: [id], onDelete: Cascade)
145:  @@index([profileId, startDate])
149:model Project {
161:  profile   Profile @relation(fields: [profileId], references: [id], onDelete: Cascade)
163:  @@unique([profileId, name])
```

The CLI is exercised on every start — see REQ-INIT-01 for the applied-migrations log.

### REQ-STACK-06 — ✅ Met

> - GraphQL.

**Implementation:** `src/graphql/graphql.module.ts:25-30` registers the Apollo driver code-first.
**Evidence:**

```
$ grep -n "GraphQLModule\|ApolloDriver\|autoSchemaFile\|playground\|LandingPage" src/graphql/graphql.module.ts
1:import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
2:import { ApolloDriver, type ApolloDriverConfig } from '@nestjs/apollo';
4:import { GraphQLModule } from '@nestjs/graphql';
25:    GraphQLModule.forRoot<ApolloDriverConfig>({
26:      driver: ApolloDriver,
27:      autoSchemaFile: true,
28:      playground: false,
30:    plugins: [ApolloServerPluginLandingPageLocalDefault({ embed: true })],
```

The schema the driver builds answers introspection, against Run B:

```
$ curl -s http://127.0.0.1:3000/graphql -H 'content-type: application/json' \
    -d '{"query":"{ __schema { queryType { name } } }"}'
{"data":{"__schema":{"queryType":{"name":"Query"}}}}
```

### REQ-STACK-07 — ✅ Met

> - Docker.

**Implementation:** one `Dockerfile` with `dev` and `runtime` stages, one base `docker-compose.yml`
and a `docker-compose.prod.yml` over it.
**Evidence:** Run B, the production overlay:

```
$ docker compose -f docker-compose.yml -f docker-compose.prod.yml ps
NAME            IMAGE                  COMMAND                  SERVICE   STATUS                    PORTS
m6-prod-app-1   m6-prod-app            "./docker-entrypoint…"   app       Up 47 seconds (healthy)   127.0.0.1:3000->3000/tcp
m6-prod-db-1    postgres:18.6-alpine   "docker-entrypoint.s…"   db        Up 52 seconds (healthy)   5432/tcp
```

The overlay's loopback binding is visible in the ports column: `127.0.0.1:3000`, not `0.0.0.0`.

The container also stops on a signal rather than being killed — evidence that the process, not a
shell, is PID 1:

```
$ time docker compose -f docker-compose.yml -f docker-compose.prod.yml stop app
 Container m6-prod-app-1  Stopping
 Container m6-prod-app-1  Stopped
docker compose  0.04s user 0.02s system 24% cpu 0.260 total

$ docker inspect --format '{{.State.ExitCode}} {{.State.Status}} {{.State.OOMKilled}}' m6-prod-app-1
0 exited false
```

0.260s against Docker's ten-second kill timeout, and exit code `0`. A signal that never arrived
would have given ten seconds and exit `137`.

---

## REQ-API

### REQ-API-01 — ✅ Met

> Приложение должно предоставлять Apollo Sandbox (GraphQL Playground), через которое можно получить информацию о Вас, Вашем опыте работы, навыках и проектах.

**Implementation:** `src/graphql/graphql.module.ts:28-30` disables the legacy playground and installs
the embedded Sandbox landing page, so the endpoint serves Sandbox rather than Apollo's production
landing page. Evidence is taken from Run B, where `NODE_ENV=production` — the case the defaults
break.
**Evidence:**

```
$ docker compose -f docker-compose.yml -f docker-compose.prod.yml exec -T app printenv NODE_ENV
production

$ curl -s http://127.0.0.1:3000/graphql -H 'accept: text/html' -o m6-sandbox-prod.html \
    -w 'GET /graphql -> %{http_code}, %{size_download} bytes\n'
GET /graphql -> 200, 3522 bytes

$ grep -oE '<script[^>]*>' m6-sandbox-prod.html
<script nonce="f61cfa44750dc5e9fca31c0fcda8b17f944ea75e922d2e2b74988cbc54fbfa35" src="https://embeddable-sandbox.cdn.apollographql.com/v2/embeddable-sandbox.umd.production.min.js?runtime=%40apollo%2Fserver%405.5.1">
<script nonce="f61cfa44750dc5e9fca31c0fcda8b17f944ea75e922d2e2b74988cbc54fbfa35">
```

Both script tags on the page are printed, unfiltered. The bundle is `embeddable-sandbox`, not
`embeddable-explorer` — the latter is Apollo's production landing page and is what a default
configuration would have served here.

Per this requirement's verification wording, the deployed instance is REQ-DELIV-01's artifact and is
not re-evidenced here.

### REQ-API-02 — ⚠️ Partially met

> Приложение должно предоставлять Apollo Sandbox (GraphQL Playground), через которое можно получить информацию о Вас, Вашем опыте работы, навыках и проектах.

**Implementation:** the same endpoint that serves Sandbox answers the query; the profile and its four
collections come back in one response.

**What is evidenced:** the endpoint returns every field the requirement names — see REQ-API-03 for
the reference query's response and REQ-DATA-01 for the coverage response, both taken over HTTP
against the running container.

**What is not:** this requirement is verified by running REQ-API-03's query *inside* Sandbox, in a
browser. Every response cited in this report was obtained with `curl`, which proves the endpoint
serves the Sandbox bundle and answers the query, but not that Sandbox itself runs and issues it.

The browser check was attempted against the running container and did not complete. The page itself
loaded — the tab title became `Apollo Server` and Sandbox's own shell rendered — but the application
bundle, which Sandbox fetches from Apollo's CDN rather than from this server, did not, and Sandbox
replaced its UI with its offline notice: *"Apollo Sandbox cannot be loaded; it appears that you might
be offline."*

That is a property of the browser it was attempted in, not of this project. The same bundle the page
asks for fetches normally from the same machine:

```
$ curl -sS -o /dev/null -w '%{http_code} (%{size_download} bytes)\n' \
    'https://embeddable-sandbox.cdn.apollographql.com/v2/embeddable-sandbox.umd.production.min.js?runtime=%40apollo%2Fserver%405.5.1'
200 (73273 bytes)
```

And the server's own half of the exchange is already evidenced under REQ-API-01: `200`, 3522 bytes,
with the `embeddable-sandbox` script tag. What is missing is only the browser session, so the status
stays `⚠️` rather than `✅`.

### REQ-API-03 — ✅ Met

> API должно позволять получить профиль и связанные с ним данные, например:
>
> ```graphql
> query {
>   profile {
>     name
>     description
>     skills {
>       name
>     }
>     experience {
>       company
>       position
>     }
>     projects {
>       name
>     }
>   }
> }
> ```

**Implementation:** `src/profile/profile.resolver.ts:28` exposes the root `profile` query; lines
33-52 resolve `links`, `skills`, `experience` and `projects` as fields.

**Evidence:** the query above, taken from `ASSIGNMENT.md:48-63` and sent unchanged, against Run A:

```
$ curl -s http://localhost:3000/graphql -H 'content-type: application/json' --data @m6-reference-query.json
{
  "data": {
    "profile": {
      "name": "Anatoly Shipitsyn",
      "description": "Full-stack developer and automation architect with more than twenty years in IT. I build multi-tenant SaaS platforms on NestJS, GraphQL and PostgreSQL, ship the React and React Native clients that sit on top of them, and design the integrations that connect them to the rest of a business: MCP servers for AI agents, n8n and Temporal.io workflows, ETL pipelines. I work end to end, from the schema and its migrations through the API and the client to the CI/CD and Docker deployment that carry it to production.",
      "skills": [
        { "name": "TypeScript" },
        { "name": "Node.js" },
        […  27 skills in total …]
        { "name": "ETL Pipelines" }
      ],
      "experience": [
        { "company": "Speed & Function", "position": "Software Developer" },
        { "company": "LLC \"Korund\"", "position": "Front-end Developer" },
        […  8 roles in total …]
        { "company": "LLC \"Individ\"", "position": "Front-end Developer" }
      ],
      "projects": [
        { "name": "DailyMark" },
        { "name": "SecureCore" },
        { "name": "Digital Business Card" },
        { "name": "Workspace Plugins" }
      ]
    }
  }
}
```

All four blocks carry data and the response has no `errors` key. The same query against Run B — the
deployed image — returned the same data; see REQ-EVAL-07.

---

## REQ-DATA

The ten entries below are answered by one response: the coverage query from `REQUIREMENTS.md:169-186`,
which selects every modelled field, including the three the reference query never touches — `links`,
`startDate`/`endDate` and `achievements`. It is printed once here and cited by path in the other nine.

### REQ-DATA-01 — ✅ Met

> 1. Профиль:
>    - имя;

**Implementation:** `Profile.name`, `prisma/schema.prisma:36`, exposed by
`src/profile/models/profile.model.ts`.
**Evidence:** the coverage query, against Run A:

```
$ curl -s http://localhost:3000/graphql -H 'content-type: application/json' --data @m6-coverage-query.json
{
  "data": {
    "profile": {
      "name": "Anatoly Shipitsyn",
      "description": "Full-stack developer and automation architect with more than twenty years in IT. […]",
      "links": [
        { "label": "GitHub",    "url": "https://github.com/anatolyshipitsyn" },
        { "label": "LinkedIn",  "url": "https://www.linkedin.com/in/anatoly-shipitsyn/" },
        { "label": "Telegram",  "url": "https://t.me/anatoly_cg" },
        { "label": "Online CV", "url": "https://www.kickresume.com/cv/anatoly-shipicin/" }
      ],
      "skills": [
        { "name": "TypeScript" }, { "name": "Node.js" }, { "name": "NestJS" },
        { "name": "GraphQL" }, { "name": "Prisma" }, { "name": "TypeORM" },
        { "name": "PostgreSQL" }, { "name": "Redis" }, { "name": "Elasticsearch" },
        { "name": "MongoDB" }, { "name": "React" }, { "name": "React Native" },
        { "name": "Next.js" }, { "name": "Ant Design" }, { "name": "Tailwind CSS" },
        { "name": "BullMQ" }, { "name": "Temporal.io" }, { "name": "n8n" },
        { "name": "Model Context Protocol (MCP)" }, { "name": "AWS Lambda" },
        { "name": "Serverless Framework" }, { "name": "Terraform" }, { "name": "Docker" },
        { "name": "GitLab CI" }, { "name": "GitHub Actions" }, { "name": "REST APIs" },
        { "name": "ETL Pipelines" }
      ],
      "experience": [
        {
          "company": "Speed & Function",
          "position": "Software Developer",
          "startDate": "2016-02-01T00:00:00.000Z",
          "endDate": null,
          "achievements": [ … 10 entries … ]
        },
        {
          "company": "LLC \"Korund\"",
          "position": "Front-end Developer",
          "startDate": "2014-12-01T00:00:00.000Z",
          "endDate": "2016-02-01T00:00:00.000Z",
          "achievements": [ … 1 entry … ]
        },
        […  6 further roles, back to 2000-11-01 …]
      ],
      "projects": [
        { "name": "DailyMark",             "url": "https://dailymark.me" },
        { "name": "SecureCore",            "url": "https://securecore.com" },
        { "name": "Digital Business Card", "url": "https://github.com/anatolyshipitsyn/digital-business-card" },
        { "name": "Workspace Plugins",     "url": "https://github.com/anatolyshipitsyn/workspace-plugins" }
      ]
    }
  }
}
```

Every path the ten REQ-DATA entries name is populated. The only null in the whole response is the
current role's open end date:

```
$ jq -c '[paths(.==null)]' m6-coverage.json
[["data","profile","experience",0,"endDate"]]

$ jq 'has("errors")' m6-coverage.json
false
```

`data.profile.name` — `"Anatoly Shipitsyn"`.

### REQ-DATA-02 — ✅ Met

> 1. Профиль:
>    - краткое описание;

**Implementation:** `Profile.description`, `prisma/schema.prisma:36`.
**Evidence:** `data.profile.description` in the REQ-DATA-01 response — a 500-character summary, not a
placeholder.

### REQ-DATA-03 — ✅ Met

> 1. Профиль:
>    - ссылки на GitHub/LinkedIn или другие профессиональные ресурсы.

**Implementation:** `Link`, `prisma/schema.prisma:80`, unique per `(profileId, url)` at line 98;
resolved as a field at `src/profile/profile.resolver.ts:33`.
**Evidence:** `data.profile.links[]` in the REQ-DATA-01 response — four entries, GitHub and LinkedIn
among them, each with `label` and `url`. The reference query never selects this field, which is why
the coverage query exists.

### REQ-DATA-04 — ✅ Met

> 2. Список навыков.

**Implementation:** `Skill`, `prisma/schema.prisma:102`; resolved at `profile.resolver.ts:38`.
**Evidence:** `data.profile.skills[].name` in the REQ-DATA-01 response — 27 entries.

### REQ-DATA-05 — ✅ Met

> 3. Опыт работы:
>    - компания;

**Implementation:** `Experience.company`, `prisma/schema.prisma:119`; resolved at
`profile.resolver.ts:47`.
**Evidence:** `data.profile.experience[].company` in the REQ-DATA-01 response — 8 roles.

### REQ-DATA-06 — ✅ Met

> 3. Опыт работы:
>    - должность;

**Implementation:** `Experience.position`, `prisma/schema.prisma:119`.
**Evidence:** `data.profile.experience[].position` in the REQ-DATA-01 response.

### REQ-DATA-07 — ✅ Met

> 3. Опыт работы:
>    - период работы;

**Implementation:** `Experience.startDate` and `Experience.endDate`, `prisma/schema.prisma:119`,
indexed by `@@index([profileId, startDate])` at line 145 — the ordering the resolver reads by.
**Evidence:** `data.profile.experience[].startDate` / `.endDate` in the REQ-DATA-01 response. The
period is a pair, and a nullable end is what an ongoing role means: the current role has
`"startDate": "2016-02-01T00:00:00.000Z"` with `"endDate": null`, and it is the only null in the
response. Neither field is selected by the reference query.

### REQ-DATA-08 — ✅ Met

> 3. Опыт работы:
>    - Ваши достижения.

**Implementation:** `Experience.achievements`, a scalar list — one of the reasons PostgreSQL was
chosen; see *On the database* in `REQUIREMENTS.md`.
**Evidence:** `data.profile.experience[].achievements` in the REQ-DATA-01 response — every role
carries at least one entry, the current role ten. Not selected by the reference query.

### REQ-DATA-09 — ✅ Met

> 4. Проекты:
>    - название;

**Implementation:** `Project.name`, `prisma/schema.prisma:149`, unique per `(profileId, name)` at
line 163; resolved at `profile.resolver.ts:52`.
**Evidence:** `data.profile.projects[].name` in the REQ-DATA-01 response — four projects.

### REQ-DATA-10 — ✅ Met

> 4. Проекты:
>    - ссылка на проект/репозиторий.

**Implementation:** `Project.url`, `prisma/schema.prisma:149`.
**Evidence:** `data.profile.projects[].url` in the REQ-DATA-01 response — two live products and two
repositories.

---

## REQ-INIT

### REQ-INIT-01 — ✅ Met

> При запуске приложения база данных должна быть автоматически подготовлена и заполнена Вашими данными.

**Implementation:** `docker-entrypoint.sh:4` runs `prisma migrate deploy` before the image's `CMD`,
in both image targets, so a start needs no migration step of its own:

```
$ cat -n docker-entrypoint.sh
     1  #!/bin/sh
     2  set -e
     3
     4  ./node_modules/.bin/prisma migrate deploy
     5  exec "$@"
```

**Evidence — the positive case.** Run A, from the clean clone against an empty volume:

```
$ grep -nE "migration|Applying" m6-run-a.log | head -20
134:app-1  | 5 migrations found in prisma/migrations
136:app-1  | Applying migration `20260828095428_init`
137:app-1  | Applying migration `20260829093218_seed_profile`
138:app-1  | Applying migration `20260830170427_add_default_profile_flag`
139:app-1  | Applying migration `20260830171014_add_collection_sort_order`
140:app-1  | Applying migration `20260830172851_add_audit_timestamps`
142:app-1  | The following migration(s) have been applied:
144:app-1  | migrations/
[…]
156:app-1  | All migrations have been successfully applied.
```

No command was run between `git clone` and `docker compose up --build`. The schema migration and the
seed migration are in the same queue, which is why one line covers both halves of the requirement —
*подготовлена* and *заполнена*.

**Evidence — the negative case.** The runtime image pointed at a port with nothing behind it:

```
$ docker compose -f docker-compose.yml -f docker-compose.prod.yml run --rm --no-deps -e POSTGRES_PORT=5433 app; echo "exit=$?"
 Container m6-prod-app-run-51d9b2618f19  Creating
 Container m6-prod-app-run-51d9b2618f19  Created
Loaded Prisma config from prisma.config.ts.

Prisma schema loaded from prisma/schema.prisma.
Datasource "db": PostgreSQL database "card_prod", schema "public" at "db:5433"

Error: P1001: Can't reach database server at `db:5433`

Please make sure your database server is running at `db:5433`.
exit=1
```

Three things together are the evidence: the non-zero exit, Prisma's `P1001`, and the absence of any
Nest bootstrap line — the last is what separates a container that never started from one that started
and could not answer:

```
$ grep -icE "Starting Nest application|Nest application successfully started" m6-negative.log
0
$ echo "grep_exit=$?"
grep_exit=1
```

The strings searched for are the two the application actually logs on the way up; both are present in
Run A's log and neither appears here.

### REQ-INIT-02 — ✅ Met

> При запуске приложения база данных должна быть автоматически подготовлена и заполнена Вашими данными.

**Implementation:** the seed is a migration, so it is recorded in `_prisma_migrations` and skipped on
every later start — see *On filling the database* in `REQUIREMENTS.md`. The assignment says *при
запуске*, every start rather than the first, so the check is to start twice without clearing the
volume.

**Evidence:** Run A was stopped and started again on the surviving volume. Across both starts the log
holds each `Applying migration` line exactly once — none repeated — plus one `No pending migrations to
apply.` from the second:

```
$ docker compose logs app | grep -iE "no pending migrations|Applying migration" | sort | uniq -c
   1 app-1  | Applying migration `20260828095428_init`
   1 app-1  | Applying migration `20260829093218_seed_profile`
   1 app-1  | Applying migration `20260830170427_add_default_profile_flag`
   1 app-1  | Applying migration `20260830171014_add_collection_sort_order`
   1 app-1  | Applying migration `20260830172851_add_audit_timestamps`
   1 app-1  | No pending migrations to apply.
```

The data is unchanged and not duplicated — the coverage query, re-run after the second start, is
byte-identical to the first:

```
$ diff <(jq -S . m6-coverage.json) <(jq -S . m6-coverage-2.json) && echo "identical"
identical
```

**Method note.** The plan for this check called for `docker compose down` followed by `up -d`, which
removes the containers and keeps the volume. `docker compose down` was unavailable in the environment
this evidence was produced in, so the second start was taken with `stop` followed by `up -d`. The
container is restarted rather than recreated; the entrypoint still re-runs, which is what the
requirement turns on, and the volume is untouched either way. What this variant does *not* separately
demonstrate is a start from a newly created container against an existing volume.

### REQ-INIT-03 — Withdrawn

> *No corresponding text in the assignment.*

*Withdrawn.* Idempotent startup is not stated in the assignment; it is now part of how REQ-INIT-02 is
verified. The ID is kept, with its section, as the worked example of the withdrawal convention — so
that the rule is demonstrated rather than merely described. No evidence block, by that rule.

---

## REQ-ARCH

### REQ-ARCH-01 — ✅ Met

> Конкретную структуру GraphQL API, базы данных и архитектуру приложения выберите самостоятельно.

**Implementation:** all three structures are chosen and the reasoning for each is recorded rather
than left implicit.

- **Database** — `prisma/schema.prisma`: `Profile` with four owned collections, each cascading, each
  constrained (`@@unique([profileId, url])`, `@@unique([profileId, name])`) or indexed
  (`@@index([profileId, startDate])`). The choice of PostgreSQL, and what depends on it, is *On the
  database* in `REQUIREMENTS.md`.
- **GraphQL API** — code-first, one root query with the collections as resolved fields rather than one
  eager shape: `src/profile/profile.resolver.ts:28` and `:33-52`. The reasoning is *On serving
  Sandbox in production* and the nested-data notes in `REQUIREMENTS.md`.
- **Application architecture** — five modules composed at `src/app.module.ts:15`:

```
$ find src -name '*.ts' -not -path 'src/generated/*' | sort
src/app.module.ts
src/config/config.module.ts
src/config/namespaces/…            (common.config, database.config, database-url, port)
src/config/services/…              (common-config.service, database-config.service)
src/graphql/graphql.module.ts
src/health/health.controller.ts
src/health/health.module.ts
src/health/health.service.ts
src/main.ts
src/prisma/prisma.module.ts
src/prisma/prisma.service.ts
src/profile/models/…               (experience, link, profile, project, skill)
src/profile/profile.module.ts
src/profile/profile.resolver.ts
src/profile/profile.service.ts
[…  4 .spec.ts files omitted from this listing …]
```

**Evidence:** the layout above, the schema, and the decision notes in `REQUIREMENTS.md` cited by
heading. That the structures are coherent rather than merely present is what REQ-ARCH-02, REQ-EVAL-03
and REQ-EVAL-04 evidence.

### REQ-ARCH-02 — ✅ Met

> Бизнес-логика, работа с данными и GraphQL API должны иметь разумное разделение ответственности.

**Implementation:** three layers. `src/prisma/prisma.service.ts` owns the client and the connection
lifecycle; `src/profile/profile.service.ts` holds the business logic; `src/profile/profile.resolver.ts`
maps it onto the schema and holds none. The GraphQL types in `src/profile/models/` are the API's own,
not Prisma's.

**Evidence:** no Prisma or generated type is imported by the resolver or by any model:

```
$ grep -rniE "^import .*(prisma|generated)" src/profile/profile.resolver.ts src/profile/models/ \
    && echo "FOUND — REQ-ARCH-02 violated" || echo "none — REQ-ARCH-02 holds"
none — REQ-ARCH-02 holds
```

The match is on import statements rather than on the word: the resolver's own comment explains that it
holds no Prisma type, and a bare `grep prisma` would match that documentation and prove nothing.

---

## REQ-EVAL

### REQ-EVAL-01 — ✅ Met

> ## Что оценивается:
>
> - в первую очередь оценивается не количество написанного кода, а качество инженерных решений.

**Implementation:** scope was held to the assignment, and abstractions were removed when they stopped
earning their place rather than kept because they existed.

**Evidence:**

```
$ git log --oneline --all | grep -i validation
f7f38e5 refactor: stop exporting the validation schema
```

A public surface withdrawn once it had no second caller. Decisions taken *not* to build, each
recorded in `REQUIREMENTS.md` rather than discovered in the diff: no rollback step, no image
registry, no image tagging scheme, no second environment, no monitoring, no `DATABASE_URL` variable
beside the three it would be derived from, and no migration step in the deploy workflow — the
entrypoint owns the queue, and the job asserts rather than repeats it.

The counter-evidence a reviewer would look for is absent: no unused module, and `REQ-INIT-03` was
withdrawn rather than retro-fitted with a feature to justify it.

### REQ-EVAL-02 — ✅ Met

> ## Обратите внимание на:
>
> - структуру приложения и разделение ответственности;

**Covered by:** REQ-ARCH-02. The assignment states this twice — once as a requirement, once as a
criterion — and the layer separation evidenced there proves both. The artifact is not reprinted here.

### REQ-EVAL-03 — ✅ Met

> ## Обратите внимание на:
>
> - работу GraphQL с вложенными данными;

**Implementation:** each collection is a `@ResolveField`, so the SQL issued is one statement for the
root plus one per selected relation, and does not grow with the number of rows returned.

**Evidence:** Prisma's query log, counted around a single request. The readiness probe issues a
`SELECT 1` every ten seconds, so those are filtered out:

```
$ count() { docker compose logs app | grep 'PrismaService' | grep -vc 'SELECT 1'; }

$ count                        # before
9
$ curl … --data @m6-reference-query.json > /dev/null
$ count                        # after
13
reference query: 4 statements

$ count                        # before
13
$ curl … --data @m6-coverage-query.json > /dev/null
$ count                        # after
18
coverage query:  5 statements
```

Four for the reference query — the root plus `skills`, `experience`, `projects`. Five for the
coverage query — the same plus `links`. The counts match the number of selected relations, not the
27 skills, 8 roles, 4 links or 4 projects returned, which is what rules out N+1.

### REQ-EVAL-04 — ✅ Met

> ## Обратите внимание на:
>
> - взаимодействие с базой данных;

**Implementation:** one module owns the connection. `src/prisma/prisma.service.ts:29` extends the
client, opens it in `onModuleInit` (`:78`) and closes it in `onModuleDestroy` (`:87`); the query log
is subscribed at construction (`:46`), which is what makes REQ-EVAL-03 measurable at all.

```
$ grep -n "onModuleInit\|onModuleDestroy\|log:\|export class" src/prisma/prisma.service.ts
16:  log: [{ emit: 'event'; level: 'query' }];
29:export class PrismaService
46:      log: [{ emit: 'event', level: 'query' }],
78:  async onModuleInit(): Promise<void> {
87:  async onModuleDestroy(): Promise<void> {
```

**Evidence:** the relations, cascades and constraints in `prisma/schema.prisma` quoted under
REQ-STACK-05; the statement counts under REQ-EVAL-03; and the readiness route, which reports
reachability from the same connection rather than a second one:

```
app-1  | [Nest] DEBUG [PrismaService] 13.715334000000041ms  SELECT 1
app-1  | [Nest] LOG [NestApplication] Nest application successfully started
```

Connection strings are assembled in `src/config/namespaces/database-url.ts`, percent-encoding each
part, so a password containing `@ : / # ?` yields a URL that still parses. Run B used exactly such a
password and reached the database — see REQ-EVAL-07.

### REQ-EVAL-05 — ✅ Met

> ## Обратите внимание на:
>
> - инициализацию и заполнение базы данных;

**Covered by:** REQ-INIT-01 and REQ-INIT-02. The assignment states this twice — once as a
requirement, once as a criterion — and the applied-migrations log, the negative case and the
repeat-start check evidence both. The artifacts are not reprinted here.

### REQ-EVAL-06 — ✅ Met

> ## Обратите внимание на:
>
> - читаемость и поддерживаемость кода;

**Implementation:** ESLint at `--max-warnings 0`, Prettier, strict TypeScript, and unit tests where
they earn their place — the config namespaces, the health service and the Prisma service.

**Evidence:**

```
$ npm run lint
> digital-business-card@1.0.0 prelint
> prisma generate
✔ Generated Prisma Client (7.10.0) to ./src/generated/prisma in 28ms

> digital-business-card@1.0.0 lint
> eslint . --max-warnings 0

$ npm run build
> digital-business-card@1.0.0 build
> nest build

$ npm test
> digital-business-card@1.0.0 test
> jest
[…]
Test Suites: 5 passed, 5 total
Tests:       25 passed, 25 total
Snapshots:   0 total
Time:        2.051 s
Ran all test suites.
```

Lint clean at zero tolerance, build succeeds, 25 tests pass across 5 suites.

### REQ-EVAL-07 — ✅ Met

> ## Обратите внимание на:
>
> - корректную работу приложения после запуска с нуля.

**Implementation:** the base Compose file defaults every variable, so a clean clone starts with no
`.env` at all.

**Evidence — Run A, the reviewer's path.** A clone of the remote's default branch into an empty
directory, with a Compose project name of its own so the run had fresh volumes:

```
$ git clone git@github-my:anatolyshipitsyn/digital-business-card.git m6-clone
$ git -C m6-clone log --oneline -1
15d4e8a docs: close M5
$ ls -a m6-clone | grep -c '^\.env$'
0

$ docker compose up --build          # the command the README gives
$ docker compose ps
NAME             IMAGE                  SERVICE   STATUS                    PORTS
m6-clone-app-1   m6-clone-app           app       Up 36 seconds (healthy)   0.0.0.0:3000->3000/tcp
m6-clone-db-1    postgres:18.6-alpine   db        Up 42 seconds (healthy)   5432/tcp
```

Both services reach `healthy`, and the coverage query answers — see REQ-DATA-01, whose response is
this run's.

**Evidence — Run B, the image that gets deployed.** The same clone under the production overlay,
which the bare command never starts:

```
$ POSTGRES_USER=card_prod POSTGRES_PASSWORD='p@ss:w/rd#?' POSTGRES_DB=card_prod \
    docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build --wait
$ docker compose -f docker-compose.yml -f docker-compose.prod.yml ps
NAME            IMAGE                  SERVICE   STATUS                    PORTS
m6-prod-app-1   m6-prod-app            app       Up 47 seconds (healthy)   127.0.0.1:3000->3000/tcp
m6-prod-db-1    postgres:18.6-alpine   db        Up 52 seconds (healthy)   5432/tcp
```

The password holds `@ : / # ?`; the stack reaching `healthy` is the percent-encoding in
`src/config/namespaces/database-url.ts` working, which local development can never show because there
the password is always `card`. The coverage query against the runtime image is byte-identical to
Run A's:

```
$ diff <(jq -S . m6-coverage.json) <(jq -S . m6-coverage-prod.json) && echo "identical to run A"
identical to run A
```

**Evidence — the overlay refuses to start without its values.** `REQUIREMENTS.md` has claimed this
since M1; this is the first time it has been shown:

```
$ docker compose -f docker-compose.yml -f docker-compose.prod.yml config; echo "exit=$?"
error while interpolating x-postgres-credentials.POSTGRES_DB: required variable POSTGRES_DB is missing a value: required in production, set it in the GitHub environment
exit=1
```

**Scope note.** The clone, the Compose project and its volumes were new; the Docker layer cache on
the machine was not emptied first, so the image build reused cached layers. Nothing in this
requirement's verification turns on a cold cache — it asks for a clean clone, no carried-over volume,
both services healthy and the coverage query answering, and all four are shown above.

---

## REQ-DELIV

### REQ-DELIV-01 — ✅ Met

> ## Просим предоставить:
>
> 1. Ссылку на проект (для просмотра);

**The link:** https://card-stg.shipicin.ru/graphql

**Implementation:** `.github/workflows/deploy.yml` runs on a self-hosted runner registered to this
repository. It selects the host's Docker daemon through an SSH context, builds and starts the
production overlay there, asserts the entrypoint applied the migration queue, checks readiness from
inside the container, and last requests the reference query through the public address. That address
is the `PUBLIC_URL` variable of the repository's `Staging` environment; Cloudflare routes it to
`http://localhost:3000` on the host. The trigger is a push to `staging`, so the workflow is read from
the branch that was pushed and nothing here waits on the default branch.

**Evidence:** pushing `a1a4ba7` to `staging` ran the workflow to success — Run C.

```
$ gh run list --workflow deploy.yml --branch staging --limit 1 \
    --json databaseId,conclusion,displayTitle,headSha \
    --jq '.[] | "\(.databaseId) \(.conclusion) \(.headSha[0:7]) \(.displayTitle)"'
33401561836 success a1a4ba7 docs: record the M6 decisions
```

Two of its steps are the ones that fail if the packaging is wrong on a host holding no prior state.
The entrypoint applied the queue, on a database the deploy had just created:

```
app-1  | Applying migration `20260828095428_init`
app-1  | Applying migration `20260829093218_seed_profile`
app-1  | Applying migration `20260830170427_add_default_profile_flag`
app-1  | Applying migration `20260830171014_add_collection_sort_order`
app-1  | Applying migration `20260830172851_add_audit_timestamps`
app-1  | The following migration(s) have been applied:
```

and the application then reported itself ready against that database:

```
readiness 200
```

The address answers from outside the host too. Sandbox is what it serves — the bundle is
`embeddable-sandbox`, not the `embeddable-explorer` of Apollo's default landing page:

```
$ curl -sS -m 20 -H 'Accept: text/html' https://card-stg.shipicin.ru/graphql \
    -o sandbox.html -w '%{http_code} (%{size_download} bytes)\n'
200 (3881 bytes)

$ grep -o 'embeddable-sandbox\.cdn[^"]*' sandbox.html | tail -1
embeddable-sandbox.cdn.apollographql.com/v2/embeddable-sandbox.umd.production.min.js?runtime=%40apollo%2Fserver%405.5.1
```

And the reference query from `ASSIGNMENT.md`, pasted unchanged, comes back with the profile and its
three collections:

```
$ curl -sS -X POST https://card-stg.shipicin.ru/graphql -H 'content-type: application/json' \
    --data '{"query":"query { profile { name description skills { name } experience { company position } projects { name } } }"}'
{"data":{"profile":{"name":"Anatoly Shipitsyn","description":"Full-stack developer and automation architect with more than twenty years in IT. […]","skills":[{"name":"TypeScript"},{"name":"Node.js"},{"name":"NestJS"},[…]],"experience":[{"company":"Speed & Function","position":"Software Developer"},[…],{"company":"LLC \"Individ\"","position":"Front-end Developer"}],"projects":[{"name":"DailyMark"},{"name":"SecureCore"},{"name":"Digital Business Card"},{"name":"Workspace Plugins"}]}}}
```

27 skills, 8 experience entries and 4 projects come back. The response is cut only where marked;
REQ-API-03 prints the same shape in full against the local endpoint, and REQ-DATA-01 covers the
fields this query never selects.

**On the runner it deploys from.** The host was already running an organisation-scoped instance —
`actions.runner.korund-doo.nuc-ci.service` at `/home/runner/actions-runner`, whose `.runner` names
`"gitHubUrl": "https://github.com/korund-doo"` — which never saw this repository's jobs, because the
repository is under a user account rather than that organisation, and GitHub has no user-account
runner scope. A second instance was installed beside it, at `/home/runner/actions-runner-dbc`,
registered to this repository and left running as its own service; the first was not touched.

```
$ gh api repos/:owner/:repo/actions/runners --jq '.runners[] | "\(.name) | \(.status) | labels=\([.labels[].name]|join(","))"'
dbc-nuc | online | labels=self-hosted,Linux,X64,nuc
```

The labels satisfy the workflow's `runs-on: [self-hosted, nuc]`. The runner runs as `runner` while
the host account is `nuc`, so a bare `ssh://nuc` connects as `runner@nuc` and is refused; that is why
`HOST_DAEMON` in the workflow is `ssh://nuc@nuc`, and the daemon answers over it:

```
$ su - runner -c "DOCKER_HOST=ssh://nuc@nuc docker version --format 'server {{.Server.Version}} on {{.Server.Os}}/{{.Server.Arch}}'"
server 29.6.0 on linux/amd64
```

### REQ-DELIV-02 — ⚠️ Partially met

> ## Просим предоставить:
>
> 2. Ссылку на Git (для ознакомления с исходным кодом).

**Implementation:** the repository is at
`https://github.com/anatolyshipitsyn/digital-business-card`. `README.md` now opens with what the
project is, gives one start command, and lists the deployed Sandbox beside the local one.

**Evidence:** no placeholder survives in the README — the check this requirement fails on:

```
$ grep -nE "Pending|not implemented yet|TODO|TBD" README.md; echo "exit=$?"
exit=1
```

```
$ sed -n '9,21p' README.md
## Running it

​```bash
docker compose up --build
​```

## GraphQL Sandbox

- Deployed: https://card-stg.shipicin.ru/graphql
- Local: http://localhost:3000/graphql

Paste a query into Sandbox and run it — the profile, skills, work experience and projects come back
in one response.
```

**Why not `✅`:** this requirement is read as the reviewer sees it, from a session that is not logged
in, on the repository's default branch. The README above is committed on `staging` and has not been
merged, so `main` — the branch a reviewer lands on — still carries the `Pending` blocks this section
shows removed. The deployed link the README carries does answer; that half is closed under
REQ-DELIV-01. What is left is the merge.

---

## Summary

| Total | ✅ Met | ⚠️ Partially met | ❌ Not met | Withdrawn |
| ---: | ---: | ---: | ---: | ---: |
| 34 | 31 | 2 | 0 | 1 |

Withdrawn IDs are counted in the total and in their own column.

**The two that are not `✅`, and what closes each:**

- **REQ-API-02** `⚠️` — run the reference query inside Sandbox in a browser whose network can reach
  Apollo's CDN, and capture the session. Everything it asserts is already evidenced over HTTP; what
  is missing is the browser.
- **REQ-DELIV-02** `⚠️` — merge `staging` into `main`, the branch a reviewer reads. The deployed link
  it carries already answers.

Neither blocks the other, and neither is a defect in the application: one is a browser that could not
reach Apollo's CDN, the other a merge.
