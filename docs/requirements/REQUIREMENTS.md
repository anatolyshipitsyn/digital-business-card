# Requirements

Traceable requirements derived from the take-home assignment. The verbatim source is
[ASSIGNMENT.md](./ASSIGNMENT.md) — quotes below are copied from it unchanged (Russian, as received)
so the final compliance report can cite them literally.

**IDs are stable.** Never renumber them; mark a requirement as withdrawn instead. Every requirement
must be referenced by at least one entry of the final report (see [Report format](#report-format)).

**Nothing is invented.** Every row's **Requirement** column restates only what the assignment says,
and the quote block above each table is its source. If a statement cannot be traced to that block, it
is not a requirement and does not get an ID. Our own reading — how strictly to take a wording, what
counts as proof, which mechanism to use — lives in the **Verification** column and in the notes: the
assignment prescribes no verification method, so that column is ours by construction. This keeps the
list something a reviewer can check line by line against the original.

---

## 1. Technology stack — `REQ-STACK-*`

> Создайте Вашу цифровую визитку (backend-приложение), которая презентует Вас как специалиста, с обязательным использованием следующих технологий:
>
> - Git;
> - TypeScript;
> - Node.js;
> - NestJS;
> - Prisma;
> - GraphQL;
> - Docker.

| ID | Requirement | Verification |
| --- | --- | --- |
| REQ-STACK-01 | Git is used for version control | More than one commit; each message names a change rather than a checkpoint — no `wip`, no `fix`, no `update` standing alone |
| REQ-STACK-02 | TypeScript is the implementation language | Every source file is `.ts` — all of `src/`, and the Prisma directory apart from `schema.prisma` and the generated `.sql` migrations; the only `.js` in the repository is tooling config, and `dist/` is build output kept out of git. `tsconfig.json` sets `strict: true` — `.ts` files full of `any` would satisfy the letter and not the language |
| REQ-STACK-03 | Runs on Node.js | `package.json` engines + Dockerfile base image |
| REQ-STACK-04 | NestJS is the application framework | Nest modules bootstrapped in `src/main.ts` |
| REQ-STACK-05 | Prisma is the ORM / DB toolkit | `prisma/schema.prisma`, generated client in use |
| REQ-STACK-06 | GraphQL is the API protocol | Nest GraphQL module, generated schema |
| REQ-STACK-07 | Docker is used to run the app | `Dockerfile` + `docker-compose.yml` |

No item may be replaced with an alternative; a substitution fails the assignment.

**On the database, which the assignment does not name.** The list above mandates Prisma and says
nothing about what it talks to, so this one is ours: PostgreSQL. Not as a default — three decisions
taken elsewhere in this document depend on it. Scalar list columns exist in Prisma only for
PostgreSQL, so `achievements String[]` (REQ-DATA-08) would revert to a related table and the
DataLoader that note argues against. `migrate deploy` is a Prisma feature for relational databases
only: on MongoDB there is `db push` and nothing else, which would take out both migrations as the
schema's source of truth (REQ-INIT-01) and the seed as a migration (REQ-INIT-02). And SQLite, the
tempting one — it would collapse `docker compose` to a single service — keeps the database in a file
that does not outlive a redeploy on the hosts REQ-DELIV-01 targets, which is the trap described under
*On the deployment target*. MySQL offers no scalar lists either and nothing in exchange. Managed
PostgreSQL is on every host's free tier, so the choice costs nothing at deploy time.

## 2. GraphQL surface — `REQ-API-*`

> Приложение должно предоставлять Apollo Sandbox (GraphQL Playground), через которое можно получить информацию о Вас, Вашем опыте работы, навыках и проектах.

| ID | Requirement | Verification |
| --- | --- | --- |
| REQ-API-01 | Apollo Sandbox (GraphQL Playground) is served by the running app | Open the container's GraphQL endpoint; Sandbox loads, not Apollo's production landing page. The deployed instance is REQ-DELIV-01's artifact and is not re-evidenced here; the defaults that break it are handled under *On serving Sandbox in production* |
| REQ-API-02 | Through it, profile, experience, skills and projects are retrievable | Run REQ-API-03's query in Sandbox |

> API должно позволять получить профиль и связанные с ним данные, например:

```graphql
query {
  profile {
    name
    description
    skills {
      name
    }
    experience {
      company
      position
    }
    projects {
      name
    }
  }
}
```

| ID | Requirement | Verification |
| --- | --- | --- |
| REQ-API-03 | The API allows the profile and its related data to be retrieved, as in the example query | Taken strictly: paste the example into Sandbox unchanged; the response contains all four blocks with data |

**On the reference query as a contract.** The assignment introduces the query with «например» — an
example, not a mandated shape. Treating it as binding is a deliberate choice, stricter than the
source: the reviewer pastes this exact text into Sandbox, and a failure on an unknown field ends the
review right there. The strictness is ours, so do not later "reconcile" it away as a misreading.

It fixes names that intuition will argue with:

- Root field `profile`, singular. Exactly one profile is addressable, so it is resolved by a fixed
  unique key: the `isDefault` column, `Boolean?` and `@unique`. PostgreSQL treats nulls as distinct
  in a unique index, so every other row can hold null while at most one holds `true`, and the
  database is what enforces that — the resolver does a `findUnique` and never "whichever row comes
  back first". An earlier revision of this note put a slug in the resolver instead; that works, but
  it puts the same literal in two files with only a comment holding them together, and the flag puts
  the answer in the data, where the seed already is. How that row is written is decided under
  REQ-INIT-02.
- `experience`, not `experiences`, even though the field returns a list. Prisma will naturally name
  that relation `experiences`; the GraphQL field must not inherit it. A resolver that hands back a
  Prisma object as-is produces the wrong name and fails REQ-API-03 and REQ-ARCH-02 at once.
- `skills { name }` makes `Skill` an object type. A `String[]` column cannot answer `{ name }`, so
  this decides the data model before `schema.prisma` is written.
- `name`, `description`, `company`, `position` are fixed spellings. `title` for a position or `about`
  for a description fails the query.

Fields beyond the example remain allowed, and REQ-DATA-* requires several of them: the reference
query is the floor of the schema, not a description of all of it.

**On serving Sandbox in production.** Defaults work against REQ-API-01 here: with
`NODE_ENV=production` Apollo Server serves the production landing page instead of Sandbox, and
disables introspection — without which Sandbox cannot build the schema even if it is served. The
deployed build therefore has to opt in explicitly: `playground: false` (the legacy playground is not
what the assignment names), the local landing-page plugin with `embed: true`, and `introspection:
true`. Introspection in production is normally switched off; it is on here deliberately, because the
reviewer's only way in is the deployed Sandbox, and the schema is read-only. That is an invariant to
hold, not an observation about today's code: **no `Mutation` type is defined, and no resolver returns
anything that is not already public on a business card.** Introspection stays on only while both
hold; adding a mutation reopens this decision rather than inheriting it. An open introspectable
endpoint also accepts arbitrarily nested queries, which for a graph this shallow bounds the damage at
nothing — worth having considered rather than passed over. Record it as a decision (REQ-ARCH-01)
rather than leaving it implicit.

## 3. Data model — `REQ-DATA-*`

> Бэкенд должен содержать:
>
> 1. Профиль:
>    - имя;
>    - краткое описание;
>    - ссылки на GitHub/LinkedIn или другие профессиональные ресурсы.
> 2. Список навыков.
> 3. Опыт работы:
>    - компания;
>    - должность;
>    - период работы;
>    - Ваши достижения.
> 4. Проекты:
>    - название;
>    - ссылка на проект/репозиторий.

| ID | Requirement | Verification |
| --- | --- | --- |
| REQ-DATA-01 | Profile: name | `data.profile.name` in the coverage query's response |
| REQ-DATA-02 | Profile: short description | `data.profile.description` |
| REQ-DATA-03 | Profile: links to GitHub/LinkedIn or other professional resources | `data.profile.links[].url` |
| REQ-DATA-04 | Skills: a list | `data.profile.skills[].name` |
| REQ-DATA-05 | Experience: company | `data.profile.experience[].company` |
| REQ-DATA-06 | Experience: position | `data.profile.experience[].position` |
| REQ-DATA-07 | Experience: employment period | `data.profile.experience[].startDate` / `.endDate` |
| REQ-DATA-08 | Experience: achievements | `data.profile.experience[].achievements` |
| REQ-DATA-09 | Projects: name | `data.profile.projects[].name` |
| REQ-DATA-10 | Projects: link to the project/repository | `data.profile.projects[].url` |

**The coverage query.** Every row above is verified by one query and one response, not by ten reads
of the schema. "The field exists in `schema.prisma` and in the GraphQL type" proves the field was
*declared*; the assignment asks for it to be *retrievable* — «API должно позволять получить профиль
и связанные с ним данные». Three of these fields (REQ-DATA-03, -07, -08) appear nowhere in the
reference query, so without this one nothing would assert that a reviewer can reach them at all: a
`Link` model that is never exposed on `Profile` would satisfy a declaration check and fail the
assignment.

```graphql
query {
  profile {
    name                                  # REQ-DATA-01
    description                           # REQ-DATA-02
    links { label url }                   # REQ-DATA-03
    skills { name }                       # REQ-DATA-04
    experience {
      company                             # REQ-DATA-05
      position                            # REQ-DATA-06
      startDate endDate                   # REQ-DATA-07
      achievements                        # REQ-DATA-08
    }
    projects {
      name                                # REQ-DATA-09
      url                                 # REQ-DATA-10
    }
  }
}
```

Its response is printed once in the compliance report; each REQ-DATA entry cites its own path into
it rather than reprinting the artifact ten times, which is the padding the report rules warn about.

This query is **ours**, not the assignment's. It is a superset of the reference query in
[ASSIGNMENT.md](./ASSIGNMENT.md) and must stay one — the five reference selections above are spelled
exactly as they are there. The two are never merged: the reference query is quoted source and cannot
be edited, this one is a verification tool and may grow as REQ-DATA-* does.

**On the employment period (REQ-DATA-07).** Two fields, `startDate` and a nullable `endDate`, not one
free-text string. Experience is listed newest-first, and a string like "2021 — настоящее время"
cannot be sorted; `orderBy: { startDate: desc }` in the service is one line and correct by
construction. A null `endDate` states "current" without a sentinel string that later has to be parsed
or compared. Rendering the pair as human-readable text belongs to the client, not to the database.
This adds no machinery: `@nestjs/graphql` exposes `Date` through its built-in `GraphQLISODateTime`,
so no custom scalar and no extra dependency.

**On modelling achievements (REQ-DATA-08).** Achievements are a `String[]` column on `Experience`,
not a related table. The assignment lists them inside «Опыт работы» alongside company, position and
period — a field of the experience, not an entity of its own; they carry no attributes, no identity
and nothing ever queries them directly. The argument that forced `Skill` to be an object type does
not carry over: that one comes from the reference query selecting `skills { name }`, and the
assignment says nothing comparable about achievements. Modelling them as a table would invent an
entity the domain does not have and would then require a DataLoader to undo the N+1 that invention
creates — the chain REQ-EVAL-01 counts against. Note this is available because the database is
PostgreSQL, which supports array columns natively.

**On the audit timestamps.** Every table carries `createdAt` and `updatedAt`. The assignment asks
for neither, so the reason belongs here rather than in a commit message.

They are the cheapest thing that makes a row's history answerable at all. This database is written
only by migrations, and the content is frozen into the queue, so without them nothing records which
run produced which row — a correction shipped as a later `UPDATE` would be indistinguishable from
the original seed. Two columns buy that, and they are the columns every reviewer expects to find on
a persisted row.

They stop at the database. Neither is a GraphQL field, for the reason `sortOrder` is not one either:
they are how a row is administered, not something the card says about me, and REQ-EVAL-01 counts
unrequested surface against. Exposing them would have put two fields on all five types in a schema
whose entire payload is one card — the first two fields a reviewer reads about `Profile`, ahead of
`name` — and neither would have said anything: `updatedAt` is maintained by the Prisma client rather
than by a database trigger, and this application never writes, so until something writes through the
client `updatedAt` equals `createdAt` on every row and both read as "when the migration that created
this row ran". Keeping them out of the schema also keeps a base class out of the code that would
have existed only to share them.

`updatedAt` carries `@default(now())` beside `@updatedAt`, and that default is load-bearing. Prisma
renders `@updatedAt` alone as a NOT NULL column with no database default, because it expects the
client to be the only writer — and here the client is not: content arrives as raw SQL in the
migration queue, where a defaultless NOT NULL column makes every future data migration name the
value by hand or fail on deploy. With the default in place `@updatedAt` still moves the column on
writes through the client; it merely stops being the only thing that can supply a value.

## 4. Database initialization — `REQ-INIT-*`

> При запуске приложения база данных должна быть автоматически подготовлена и заполнена Вашими данными.

| ID | Requirement | Verification |
| --- | --- | --- |
| REQ-INIT-01 | On application start the database schema is prepared automatically | Migrations run as part of startup — no manual command; evidenced by the applied-migrations line in the startup log. The negative case counts too: point the container at an unreachable database and confirm it exits non-zero without serving a request |
| REQ-INIT-02 | On application start the database is seeded with my real data | Query returns my data right after a clean `docker compose up`; and since the assignment says *при запуске* — every start, not the first — start twice without clearing the volume: the second start logs no pending migrations, and the query returns the same response — unchanged and not duplicated |
| REQ-INIT-03 | *Withdrawn.* Idempotent startup is not stated in the assignment; it is now part of how REQ-INIT-02 is verified. Kept as the worked example of the withdrawal convention, so the rule above is demonstrated and not merely described | — |

**On preparing the schema.** The assignment says the database must be prepared automatically and
names no mechanism; `prisma db push` would satisfy the words. Migrations are chosen instead, and the
choice is ours to defend, not the assignment's to impose. Three reasons: `db push` leaves no history,
so the repository has no `prisma/migrations/` — the first thing a reviewer opens under "database
initialization", and its absence reads as a prototype whatever the schema looks like; a migration run
prints an applied-migrations line, which is the real artifact REQ-INIT-01 needs as evidence, whereas
`db push` can only be evidenced by the schema existing; and applied migrations are skipped on the
next start, which — once the seed is a migration too, see below — covers REQ-INIT-02's repeat-start
check for free.

The entrypoint runs `prisma migrate deploy`, never `prisma migrate dev`. `migrate dev` is
interactive, generates migrations on the fly, and offers to reset the database when it detects
schema drift — inside a container that either hangs without a TTY or destroys deployed data.

**On the entrypoint failing.** Two lines of the script are load-bearing and neither is the migration
command. `set -e`, because a shell that ignores a non-zero exit starts the application against a
schema that was never prepared: the container then looks healthy, Sandbox loads — the GraphQL schema
is built from code, not from the database — and only the query fails, with a Prisma error about a
missing table. That points a reviewer at the application instead of at startup, which is the most
expensive kind of failure to diagnose. And `exec "$@"`, so the process becomes PID 1 and receives
`SIGTERM` directly; without it the shell holds PID 1, does not forward the signal, and every restart
waits out the ten-second kill timeout. The command is passed through rather than named, so one
script serves both image targets: it execs `node dist/main.js` under `runtime` and the watch loop
under `dev`, and neither stage can acquire a startup contract the other does not have.

A migration that fails is recorded as failed in `_prisma_migrations`, and the next `migrate deploy`
refuses to continue until it is resolved. That is the wanted behaviour — the failure is loud and
repeatable rather than intermittent — and since the seed is a migration too, it applies to the seed.
`migrate deploy` also takes a Postgres advisory lock, so replicas starting at once serialise instead
of racing; the flip side is that a slow migration blocks every replica's startup and can outlast a
platform health check.

**On waiting for the database.** `set -e` protects the application only once the database is
reachable; before that it is what turns a routine startup race into a failed run. On a clean volume
Postgres spends the first seconds in `initdb` while the application container starts immediately, so
`migrate deploy` meets a refused connection and the entrypoint exits — the reviewer's single
`docker compose up --build` fails, which is REQ-EVAL-07 itself. The gate belongs to compose, not to
the application: every service declares a `healthcheck`, and `app` declares
`depends_on: { db: { condition: service_healthy } }`. The healthcheck alone blocks nothing — it only
publishes a status — and the `depends_on` condition is what waits on it; the two are one decision and
neither is useful without the other.

`db` is probed with `pg_isready` over TCP (`-h 127.0.0.1`), not over the Unix socket. During
initialization the official image starts a temporary server with `listen_addresses=''`, which answers
on the socket and would report ready before the real one exists; a TCP probe is refused for exactly
as long as it should be. A `start_period` keeps those early refusals from consuming `retries`.

`app` is probed by fetching `/health/readiness` with `node -e` and `fetch`: `node:*-slim` carries
neither `curl` nor `wget`, and pulling a package into the image to run a health check would be a
poor trade. It reads the status, so an application answering 500 everywhere does not pass.

**Two routes, and which one Compose asks.** `HealthModule` holds one controller and answers two
different questions, neither of them at a bare `/health` — that path 404s on purpose, because a
default route would have to pick one silently and be read as the other.

`GET /health/liveness` has an empty indicator list. Reaching the handler already proves the process
is up and the HTTP stack answers, which is all a liveness question may rest on; it is what an
orchestrator that restarts containers should be pointed at.

`GET /health/readiness` pings PostgreSQL through Terminus' own `PrismaHealthIndicator` — no further
dependency — and answers 503 when it cannot be reached. It exists because on Prisma 7 a client that
constructed successfully proves nothing about the database being there: the driver adapter opens
connections lazily, so absent a live probe the only evidence of an unreachable database would be a
failed query. `PrismaService`'s own startup statement (see *On the data access layer*) already rules
that out once, at bootstrap — but the process deliberately keeps running if the database disappears
afterward, the same asymmetry `src/health/health.service.ts` argues for this route: an unreachable
database is a reason to take an instance out of rotation, not a reason to restart it, so a one-time
gate at startup cannot be what this route leans on. It is the readiness probe, asked again on every
interval, that tells `docker compose ps` and `depends_on` the truth *now*, after bootstrap has long
finished.

Compose probes **readiness**, and the reason is what `unhealthy` does here rather than what the word
suggests. Docker's `restart` policies act on process exit; the engine does not restart a container
for failing its health check — Swarm and Kubernetes do, plain Compose does not. So the flapping
argument that would keep a database query out of a restart-triggering probe does not apply to this
file: what the status actually drives is `depends_on: condition: service_healthy` and the line a
reviewer reads in `docker compose ps`. Both are better served by the truthful answer. An application
that is running but cannot reach its database is not a thing `docker compose ps` should call
healthy, and REQ-EVAL-07 asks for a from-scratch start where the data is genuinely reachable — a
probe that cannot fail on the database cannot witness that.

This is the one place the two questions are joined, so it is stated rather than left implicit: if
this project ever runs where an orchestrator restarts on a failed probe, that probe takes
`/health/liveness` and this decision is reopened, not inherited. Terminus is what pins the framework to NestJS 11:
11.1.1 declares `@nestjs/common ^10 || ^11`, and forcing it onto 12 with `--legacy-peer-deps` would
leave a reviewer's `npm ci` failing on ERESOLVE unless the flag were baked into `.npmrc`.

None of this weakens REQ-INIT-01's negative case. Deployment is not compose — there the database is
external and no orchestrator gates startup, so an unreachable one must still make the container exit
non-zero and leave the restart to the platform. Compose removes the race locally; it does not turn
the entrypoint into something that waits.

**On filling the database: the seed is a data migration.** The seed lives in the same queue as the
schema migrations — `prisma/migrations/<timestamp>_seed_profile/migration.sql`, plain `INSERT`s,
applied by the same `prisma migrate deploy` the entrypoint already runs. One mechanism therefore
satisfies both halves of «подготовлена и заполнена», and REQ-INIT-02's repeat-start check holds by
construction rather than by care: the migration is recorded in `_prisma_migrations` and skipped on
every subsequent start, so there is no idempotency logic to get wrong. It also keeps the runtime
image free of a seed runner — no `prisma db seed`, no `ts-node`/`tsx` among the production
dependencies, only the Prisma CLI that `migrate deploy` needs anyway.

The cost is accepted deliberately: the content freezes into the queue. Correcting a sentence in the
profile is a new migration with an `UPDATE`, not an edit to a seed file, so the history will carry
entries that are about wording rather than schema. That is the trade taken in exchange for the
runs-exactly-once guarantee. It is not to be "fixed" later by moving the seed into an
application-level script, which would reintroduce precisely the idempotency problem this decision
removes.

Two consequences bind `schema.prisma` before it is written:

- **Ids are literal in the SQL.** `@default(cuid())` and `@default(uuid())` are generated
  client-side and leave no default in the database, so a raw `INSERT` from a migration would fail on
  a null id. A database-side default (`autoincrement()`, `dbgenerated("gen_random_uuid()")`) would
  solve that, but the seed migration writes its ids out instead: fixed ids make the foreign keys in
  the same file readable — a reviewer sees which achievement belongs to which position without
  running anything — and they are stable across a `migrate reset`, so a later content migration can
  target a row by id rather than by matching on its text.
- **`prisma db seed` stays unconfigured.** No `prisma.seed` key in `package.json`. Its presence
  would imply a second seeding path that nothing runs, and invite someone to wire it into the
  entrypoint alongside the migration.

Migrations apply in directory-timestamp order, so the seed migration is created after the schema
migration it depends on. And since these files now hold the content itself, the note in
`.gitignore` about `prisma/migrations/` never being ignored is load-bearing twice over.

Running migrations at startup has a packaging cost, and it is paid deliberately. `migrate deploy` is
a command of the `prisma` CLI package, which conventionally sits in `devDependencies` — a runtime
stage built with `npm ci --omit=dev` therefore fails with `prisma: not found`, and fails only once
deployed, because the development image had it. `prisma` is a production dependency here for that
reason; it is not a mistake to be tidied away. The runtime image also keeps `prisma/schema.prisma`,
`prisma/migrations/` and — on Prisma 7 — `prisma.config.ts` with them. The datasource URL is no
longer allowed inside `schema.prisma` there: the schema declares the provider and nothing else, and
the connection string is read from the config file, so an image that omits it has a CLI that cannot
find the database. `prisma.config.ts` does not travel alone: it imports the URL assembly in
`src/config/namespaces/database-url.ts`, and that import resolves to a source file rather than to
anything in `dist/`, so `database-url.ts` and the `port.ts` it depends on are copied beside it. This
is asserted rather than remembered — the stage runs `prisma validate`, which loads the config and the
schema and connects to nothing, so an image whose CLI cannot resolve its own config fails the build
instead of the deployment. The generated client needs no line of its own: Prisma 7 writes it as
TypeScript into `src/`, so `nest build` compiles it and it arrives in the image inside `dist/`.

The base image is Debian-slim rather than Alpine, and the reason is glibc rather than Prisma. On
Prisma 7 the musl target resolves on its own — `node:22-alpine` with `apk add openssl` was measured
building and running this image, picking `schema-engine-linux-musl-arm64-openssl-3.0.x` without a
warning, and coming out 83 MB smaller. What those 83 MB buy is the C library the application is
developed and tested against, and the absence of musl's differences in DNS resolution and stack
sizing, which surface under load rather than at build time. The choice is cheap to revisit: two
`FROM` lines and one package manager.

What the image does drop is what PostgreSQL-only makes dead weight. Prisma ships a query compiler
for every database it supports, twice over — as `.wasm` beside the CLI and as base64 modules inside
the client runtime — and removing the four this project will never use takes 72 MB out of the image.
The prune runs in the same layer as `npm ci`, because a later `rm` leaves the files in the layer
below and shrinks nothing, and it asserts that the PostgreSQL variants survived, so a rename in a
future Prisma release fails the build instead of the deployed container. `@prisma/studio-core` and
`@prisma/dev` look like the same kind of waste and are not: the CLI imports both eagerly at startup,
and dropping either breaks it outright.

Two more things the runtime stage does not carry. Its base tag is pinned to a minor —
`node:22.22-slim`, the version the project is developed on — rather than the floating `22-slim`:
REQ-EVAL-07 is a claim about a build that works from scratch, and a tag that moves underneath it is
the cheapest way to make that claim quietly false. And `npm`, `npx` and `yarn` are deleted from it.
Nothing in the running container installs anything, and the CLI the entrypoint needs is reachable
directly at `./node_modules/.bin/prisma`, verified in the build. That buys no space — they live in
the base image's own layer, where deleting them on top only writes a whiteout — but it takes away
the ability to fetch and run code inside a container that is reachable through the proxy.

Nothing else is added, and in particular no `ts-node`, `tsx` or `prisma db seed`: with the seed as a
migration there is no seed runner in the image at all.

**On the one `overrides` entry.** `package.json` forces `deepmerge-ts` to `8.0.2`. It is there for
GHSA-ggr8-5vv4-36mx — stack exhaustion on recursive object graphs, high severity, affecting
`deepmerge-ts <8.0.0` — and `@prisma/config@7.10.0` depends on exactly `7.1.5`. Because `prisma` is a
production dependency here, that advisory is in the deployed image's dependency set and not only in
the toolchain: without the override `npm audit --omit=dev` reports three high findings, with it
zero. The fix npm proposes instead is `npm audit fix --force`, which downgrades to `prisma@6.12.0` —
a major version back, and Prisma 7 is what the `prisma.config.ts` decision above is written against.

The residual risk is stated rather than hidden, because it is a major bump applied under a vendor's
exact pin: what merges through `deepmerge-ts` in Prisma is configuration, which is exactly what
`prisma.config.ts` is. That path is now exercised — `generate`, `migrate dev --create-only` and
`migrate deploy` all load the file and all ran under the override — so the risk is no longer
untested, only unproven against future config shapes. The build asserts the CLI still starts
(`prisma --version` in the runtime stage), which is where a broken config loader would surface
first. Drop the override the moment `@prisma/config` ships a release that depends on `8.x`
itself; until then it is load-bearing and not a leftover to tidy away.

## 5. Architecture — `REQ-ARCH-*`

> Конкретную структуру GraphQL API, базы данных и архитектуру приложения выберите самостоятельно.
>
> Бизнес-логика, работа с данными и GraphQL API должны иметь разумное разделение ответственности.

| ID | Requirement | Verification |
| --- | --- | --- |
| REQ-ARCH-01 | The concrete GraphQL API structure, database structure and application architecture are chosen by me | The schema, `prisma/schema.prisma` and the module layout exist and are coherent; the reasoning behind them is written down in README / this docs folder |
| REQ-ARCH-02 | Business logic, data access and the GraphQL API are separated into distinct layers | Resolvers hold no business logic; Prisma client is not reached from resolvers |

**On reading the environment.** `process.env` appears in one place, `src/config/`, and nowhere else
in the application. The module is three parts. *Namespaces* pair a `registerAs` factory with the zod
rules for the variables it reads, so the default and the rule that admits it are written next to each
other rather than one in `main.ts` and the other nowhere — and the factory reads each variable
*through* that same rule, so a variable has one parser and not a rule plus a cast beside it that can
drift from it. *A validator* runs the union of those rules against the whole environment inside
`ConfigModule.forRoot`, before the container is built — a missing `POSTGRES_PASSWORD` or a `NODE_ENV`
of `staging` exits non-zero during bootstrap, naming every offending variable at once, instead of
arriving later as an `undefined` at the first query or as a Sandbox that silently is not served.
*Typed services* then hand out `number` and `string`, so a consumer cannot forget that everything in
the environment starts life as `string | undefined`.

Four consequences are worth stating because they are what the shape is for. `PORT` no longer needs
the `Number(…) || …` guard `main.ts` carried: an exported but empty variable coerces to `0` and is
refused, which is the behaviour that guard was approximating — a random free port and a process that
looks healthy while nothing answers where it was expected. `PORT` and `POSTGRES_PORT` share one rule,
in `src/config/namespaces/port.ts`, bounded at both ends because a port is a 16-bit number: without
the upper bound `99999` passed validation and died later inside `listen()` on Node's own
`ERR_SOCKET_BAD_PORT`, a stack trace where the point of validating here is a refusal by name.
`POSTGRES_HOST` is admitted as a hostname or a bracketed IP literal and nothing else, because it is
the one interpolated part of the connection string that cannot be percent-encoded — encoding it
would encode the dots between its labels. Unchecked it was the worst of the three holes: a URL
parser reads the *last* `@` as the userinfo delimiter, so a host of `x@evil.host` produced
`postgresql://card:card@x@evil.host:5432/card` and sent the connection, and the password it carries,
somewhere nobody named, without a message. The
application does not read `.env`: Compose reads it, substitutes into `docker-compose.yml` and passes
process environment variables, so `ignoreEnvFile` keeps one name from acquiring two sets of defaults.
And the container fails on a bad environment before the port is bound, so the failure shows up as a
service that never reaches `healthy` rather than one that answers wrongly.

The alternative was reading `process.env` at each use site, which for three variables is shorter. It
is rejected on REQ-EVAL-07: a from-scratch start is the claim this project has to make, and the
failures that break it are configuration failures. A start that refuses with the variable's name is
worth more here than the lines it costs. The scope of it is held to what is read — two namespaces,
two services — and grows only when a variable does.

**On the first tests, and why here.** REQ-EVAL-06 asks for tests where they earn their place, which
is a bar and not an invitation to cover everything. The config namespaces are the first code in this
repository to clear it: the URL assembly and the zod rules are pure functions over their arguments,
they take milliseconds to exercise, and both of their interesting failures are invisible where the
work is done. Percent-encoding only matters when the password is not `card`, which is to say never
locally and always in production; the environment rules only matter on the start that is already
going wrong. `docker compose up` reports `healthy` either way. That combination — cheap to check,
silent when broken, and broken only where nobody is looking — is what earns a test, and the three
spec files hold twenty-one cases and no mocks.

Jest, because it is what a NestJS project is expected to carry, and ts-jest to read TypeScript with
the repository's own `tsconfig.json`. Two packages, not three: the specs take `describe`, `it` and
`expect` from `@jest/globals` rather than `@types/jest`, so no `types` entry lands in
`tsconfig.json` for every source file to pay for. One wrinkle is worth recording because it looks
like a mistake otherwise: `@nestjs/config` v12 ships ESM only. The application is untouched by that
— it compiles to CommonJS and Node 22 resolves `require()` of an ES module — but Jest's own module
registry does not, so that one package is transpiled on the way in and carved out of
`transformIgnorePatterns`, which is why the config names a `node_modules` path at all. A second
`tsconfig.build.json` keeps the specs out of `nest build`, and so out of `dist/` and the runtime
image; the Dockerfile copies it for that reason, since `nest build` falls back to `tsconfig.json`
silently when it is absent and the fallback compiles them.

M4 adds none, and that is a decision rather than an omission. A unit test over `ProfileService` with
a mocked `PrismaService` would assert that the code agrees with itself — the shape this bar exists
to refuse. An end-to-end test against a real database would be worth more, but what it asserts is
already asserted twice: by M4's own exit criteria, which run the reference and the coverage query
against the running stack, and by REQ-EVAL-07 at M5, which runs them again from a clean clone. The
cost would be a second Jest project and a test run that cannot pass without a database. The bar is
"where they earn their place", and here they do not.

## 6. Evaluation criteria — `REQ-EVAL-*`

> Что оценивается:
>
> - в первую очередь оценивается не количество написанного кода, а качество инженерных решений.
>
> Обратите внимание на:
>
> - структуру приложения и разделение ответственности;
> - работу GraphQL с вложенными данными;
> - взаимодействие с базой данных;
> - инициализацию и заполнение базы данных;
> - читаемость и поддерживаемость кода;
> - корректную работу приложения после запуска с нуля.

| ID | Criterion | Verification |
| --- | --- | --- |
| REQ-EVAL-01 | Quality of engineering decisions is judged first, not the amount of code written | Review the diff for unused abstractions and features the assignment never asked for |
| REQ-EVAL-02 | Application structure and separation of concerns | The assignment states this twice, as a requirement and as a criterion; evidenced once, under REQ-ARCH-02 |
| REQ-EVAL-03 | GraphQL handling of nested data | Read as an absence of N+1: count the SQL statements Prisma emits for the example query and for any selection nesting a list inside a list; the count must not grow with the number of parent rows |
| REQ-EVAL-04 | Sound database interaction | Prisma schema, relations, indexes, connection lifecycle |
| REQ-EVAL-05 | Database initialization and seeding | The assignment states this twice, as a requirement and as a criterion; evidenced once, under REQ-INIT-01 and REQ-INIT-02 |
| REQ-EVAL-06 | Readable, maintainable code | Lint/format clean, consistent naming, tests where they earn their place |
| REQ-EVAL-07 | The application works correctly after a from-scratch start | Clean clone + `docker compose up --build` on a machine with no prior state, no volume carried over from an earlier run; both services reach `healthy` and the coverage query answers |

**On the data access layer (REQ-EVAL-04).** One `PrismaService`, in `src/prisma/`, extends the
generated client and is the only place it is constructed. It owns the connection lifecycle at both
ends. At startup it issues `SELECT 1` from `onModuleInit`, so an unreachable database or a wrong
password fails the bootstrap instead of arriving as a GraphQL error at the first query the
reviewer runs — and it is a statement rather than `$connect()` for a reason that is specific to
Prisma 7: with the Rust query engine gone the driver adapter opens connections lazily, so
`$connect()` resolves against an unresolvable host, a wrong password and a closed port alike, and a
bootstrap gated on it reports success for a database that is not there. At shutdown it calls
`$disconnect()` in `onModuleDestroy`, which is the ordered teardown `enableShutdownHooks()` in
`main.ts` exists to reach. `PrismaModule` is deliberately not `@Global()` — the config module is,
because every layer legitimately reads configuration, whereas database access is exactly what
REQ-ARCH-02 wants confined; a module that reaches the database imports this one and says so in its
`imports`, where a review can see it.

Prisma 7 changed what "constructing the client" means, and the change is visible in `package.json`.
The Rust query engine is gone, and with it the `datasourceUrl` constructor option: the client now
connects through a driver adapter, so `@prisma/adapter-pg` is a production dependency and the pool
is node-postgres'. It is given the very string `prisma.config.ts` gives the CLI, from
`src/config/namespaces/database-url.ts` — which is why the assembly moved into a file of its own,
apart from the `registerAs` factory that wraps it: the CLI's TypeScript loader can import a module
whose only dependency is zod, where importing the namespace would pull `@nestjs/config` and the
container behind it into a process that only wants a URL. One assembly, one percent-encoding, and no
way for `migrate deploy` and the running application to address different databases.

The generated client is TypeScript under `src/generated/`, not a package in `node_modules`. It is
build output and is git-ignored as such: `prisma generate` reproduces it from `prisma/schema.prisma`,
which is the file under review. It runs from an npm lifecycle hook on every script that compiles or
type-checks the tree — `prebuild`, `prelint`, `pretest`, and the pre-existing `prestart:dev` — so a
clean clone needs no remembered extra step: whichever of those a reviewer or CI runs first regenerates
the client before anything reads it. The Docker `build` stage does not call the CLI itself; it runs
`npm run build`, and `prebuild` fires ahead of `nest build` as part of that one command.

A single `prepare` script looks like the obvious way to say this once, and is rejected for a reason
specific to this Dockerfile: `prepare` fires on `npm ci`, and `npm ci` runs twice in the image, in two
stages that do not yet have `prisma/` on disk when it does — the `deps` stage installs from
`package.json` and `package-lock.json` alone, before `prisma` is copied in, and the runtime stage's
`npm ci --omit=dev` runs before its own later `COPY prisma ./prisma`. A `prepare` hook would fail
both builds looking for a schema that is not there yet. Per-script hooks, tied to the commands that
actually need the client, are what a clean clone requires without breaking the image. `generate`
connects to nothing, which is why `prisma.config.ts` omits the datasource altogether when the
environment names no database: the image build has no credentials and should not need invented ones.

**On the indexes.** Every child table carries exactly one composite index, leading with `profileId`.
Three of them are `@@unique` — `(profileId, url)` on `Link`, `(profileId, name)` on `Skill` and on
`Project` — because the same resource, skill or project listed twice on one card is a data error and
not a preference; the index is the byproduct of stating that. `Experience` has no such natural key,
since the same role at the same company can genuinely be held twice, so it takes a plain
`@@index([profileId, startDate])`, and it carries `startDate` because that is what the list is
ordered by. The reason each one leads with `profileId` is that PostgreSQL does not index a foreign
key column on its own: without it the referential check behind `onDelete: Cascade` scans the child
table. None of this is a performance claim at this row count — a business card holds a handful of
rows — it is the shape being right, and the constraints being real.

Two columns were added at M4 and neither changes that reasoning. `Profile.isDefault` carries a
unique index, which is the whole point of it: on a nullable column PostgreSQL admits many nulls and
one row per distinct value, so "at most one profile marked `true`" becomes a constraint the database
checks rather than a convention the seed observes. What the index does not rule out is a single
`false` row beside it — the guarantee is per value, not one non-null row in total — and none is ever
written, because null already says "not the default". The textbook form is a partial unique index —
`... WHERE "isDefault"` — and it is rejected because Prisma cannot declare one in `schema.prisma`,
so it would have to be raw SQL and the schema would then drift from the database it describes.

`sortOrder` on `Link`, `Skill` and `Project` gets no index at all. It is read only inside an
`ORDER BY` over a handful of rows already filtered to one profile, and an index for that would be
exactly the performance claim the paragraph above declines to make. It carries no unique constraint
either: the services break ties on the visible column, so duplicates still order reproducibly,
whereas a constraint would make any future reordering fight the database mid-transaction.

**On resolving the relations.** Each of the profile's four relations — `links`, `skills`,
`experience`, `projects` — is a `@ResolveField`, not a single `findUnique` with `include`. Neither
shape produces an N+1, so that is not what decides it; over-fetching is. An `include` loads all four
relations on every request, including the reference query in [ASSIGNMENT.md](./ASSIGNMENT.md), which
asks for none of the links and none of the achievements. Field resolvers load exactly what the
selection set names, which is what «работа GraphQL с вложенными данными» is asking after.

**On the GraphQL layer (REQ-API-01, REQ-STACK-06).** Code-first, through `@nestjs/graphql` and the
Apollo driver, in one `AppGraphQLModule` that registers the endpoint and one `ProfileModule` that
holds the domain. `ProfileService` is the whole of the business logic — which row is the profile,
and in what order each collection comes back — and the resolver holds no `where`, no `orderBy` and
no Prisma type. Four decisions in that layer are not defaults.

The versions are pinned a major behind. `@nestjs/graphql@14` and `@nestjs/apollo@14` require
`@nestjs/core ^12`, and this application is on 11.2.3, so both stay on `13.4.5`; upgrading NestJS to
reach the newer line would put every existing module at risk for a milestone whose job is to add an
API. `graphql` stays on `16.14.2` for a similar reason, `17` being new enough that the ecosystem
risk buys nothing here. A fifth package, `@as-integrations/express5`, is declared an *optional* peer
of `@nestjs/apollo` and is not optional: this project runs Express 5, and `GraphQLModule` refuses to
start without it — after the routes are mapped, so the container comes up and then goes unhealthy
with nothing wrong at build time. All five are production dependencies, because the API is what the
runtime image serves.

The generated schema is kept in memory (`autoSchemaFile: true`). Written to a file it would be build
output committed to git — which this repository already refuses for `src/generated/` — or
git-ignored, and then invisible to the reviewer it was meant to serve. The reviewer reads the schema
in Sandbox, which the assignment mandates anyway.

Every list is ordered explicitly, because PostgreSQL guarantees no order without one and the
coverage query's response is quoted in the report. `Experience` sorts by `startDate desc`, which is
what the two date columns were chosen for. The other three carry a stored `sortOrder`, numbered by a
migration in the order the seed lists them: alphabetical was the cheaper answer and is the wrong
one, since a skill list that opens on `Ant Design` and closes on `TypeScript` reads as unsorted on
the one page whose whole job is to present a specialist. `sortOrder` is not exposed as a GraphQL
field — it is how the list is ordered, not something the card says about me — and it is not called
`position`, because `Experience.position` already means the job title.

Each of the four then breaks ties on a visible column — `label`, `name`, `name` and `company` — and
that second key is not decoration. Neither leading key is unique: `sortOrder` carries no unique
constraint by the decision above, and two positions can genuinely begin in the same month. A tie
under `ORDER BY` is resolved by whatever the plan happens to produce, so without the second key the
response quoted in the report would not be reproducible, which is the one property quoting it
depends on.

A missing profile row is an error, which lets the root field be non-null. The seed guarantees the
row, so its absence means the database was never prepared, and that should surface as an error
rather than as `{"data": {"profile": null}}`, which reads as an empty card. It is raised as a
`GraphQLError` carrying `extensions.code = "NOT_FOUND"`, not as Nest's `NotFoundException`: this
application answers over a protocol with no status codes, and Apollo reports an exception it does
not recognise as `INTERNAL_SERVER_ERROR`, with the HTTP envelope — `status: 404`, `originalError` —
attached to the extensions, so a client would read "internal error" for the one thing that can go
wrong here. Naming the code is one line and is not an error taxonomy: it stays the only error this
layer defines, and a read-only schema with one root field that invented a set of them would be
exactly the scope REQ-EVAL-01 counts against.

**On DataLoader.** The assignment asks for sound handling of nested data; batching is a means, not a
requirement, so DataLoader is not one either. This schema cannot produce an N+1, so none is
introduced. The root is a single `profile`, so the cost is one statement for the root plus one per
selected relation — five for the coverage query, four for the reference query, and in neither case
does the number move with the count of links, skills, positions or projects. The one place an N+1
could appear is a list nested inside a list, and there is no such nesting: achievements are a column
on `Experience`, not a relation (see *On modelling achievements* under REQ-DATA-08). A DataLoader
here would batch nothing and would count as scope beyond the assignment (REQ-EVAL-01).

REQ-EVAL-03 is therefore evidenced by a statement count that does not move with row counts, not by
the presence of the library. Note what that does *not* claim: collapsing the resolvers into one
`include`, or switching Prisma to a join strategy for relations, changes the count while leaving it
just as independent of row counts, so REQ-EVAL-03 would survive either. The argument for field
resolvers is the one made above, and it is about over-fetching.

The guarantee is conditional on two things holding: the root stays a single object — a `profiles`
list root would reintroduce the problem at once, and then the relation resolvers really would fire
once per parent row — and achievements stay a column. If either changes, this note is what has to be
reopened.

**On where that count is read.** From the application's own log. `PrismaService` constructs the
client with `log: [{ emit: 'event', level: 'query' }]` and subscribes to the event, writing each
statement and its duration to the Nest logger at `debug` — so counting them is reading
`docker compose logs app` around one Sandbox request, not attaching a profiler or turning on
`log_statement` in PostgreSQL. It is wired in the data access layer because that is where it belongs
— the statements are the client's, not the resolvers' — and it was wired at M2 rather than at M4 so
that the evidence exists before the code whose behaviour it has to characterise. Development only:
in production it would be one write per statement per request, on an application whose entire payload
is a single profile, and the parameters it would carry are that profile's own data.

## 7. Deliverables — `REQ-DELIV-*`

> Просим предоставить:
>
> 1. Ссылку на проект (для просмотра);
> 2. Ссылку на Git (для ознакомления с исходным кодом).

| ID | Requirement | Verification |
| --- | --- | --- |
| REQ-DELIV-01 | A link to the project, for viewing | Read as a running instance, since REQ-DELIV-02 already covers the source: open the URL from a clean browser session; Sandbox loads and the REQ-API-03 query returns data |
| REQ-DELIV-02 | A link to the Git repository with the source | Open the repo URL as the reviewer sees it: the README opens with what the project is, one start command and the Sandbox link, and carries no unfinished placeholder — a `Pending` block anywhere in it means this is not met |

**On the deployment target.** The host is a VPS that already terminates TLS behind a reverse proxy,
with the application on a subdomain. That settles the shape: `docker compose` is not the local
convenience here, it *is* the deployment, and Postgres runs in it rather than as a managed service.

It is one base `docker-compose.yml` plus `docker-compose.prod.yml` over it. The base file is the
local development environment: the `app` service builds the Dockerfile's `dev` stage and runs the
working tree in watch mode, bind-mounted, so an edit on the host is compiled and restarted inside
the container. The overlay turns that same service into the deployment — the `runtime` stage, no
source mount, no watch command, the loopback binding — and defines no service of its own.

That ordering costs something and the cost is stated rather than hidden: `docker compose up --build`
on a clean clone brings up the development environment, not the image that answers at
REQ-DELIV-01's URL, so REQ-EVAL-07 is evidenced with the overlay in place — one extra `-f`. The
README carries both commands from M6, where it stops being a placeholder. The two starts share the
database, the network, the port and the health checks; what differs is which stage of the same
Dockerfile the application comes from.

Beyond that stage, the overlay carries two differences.

The first is where the values come from. The base file defaults every variable, so a clean clone
starts with `docker compose up` and no `.env` at all — which is precisely what REQ-EVAL-07 has a
reviewer do, and why nothing in `.env` may be mandatory. The overlay inverts that with `:?`: in
production the same variables are required, so a deploy that is missing one refuses to start rather
than quietly coming up on the development password. Those values are held in the repository's GitHub
environment and reach the deploy as process environment variables, so no file in the repository ever
carries a production secret. There is no `DATABASE_URL` among them, and none anywhere: the database
is a service in the same compose project rather than a managed instance, so the connection string is
derivable from `POSTGRES_USER`, `POSTGRES_PASSWORD` and `POSTGRES_DB`, and a fourth variable holding
it whole would only create a way for the two to disagree. The base file therefore hands the
application the same three values it initialises the server with — one definition, reached by both
services through a YAML merge key, so overriding the password cannot leave the client holding a
password the server never got.

Where the string is assembled is the second half of that decision, and it is the application, in
`src/config/namespaces/database-url.ts`, not the Compose file. Compose substitutes literally and
cannot percent-encode: a password containing `@`, `:`, `/`, `#` or `?` yielded a URL that parses as a
different host and database, and it fails only where the password is not `card`, which is to say only
in production. `encodeURIComponent` on each part removes the failure instead of documenting it, so
the production password is no longer constrained to letters and digits. The host is the exception,
and it is checked rather than escaped: escaping it would encode the dots between its labels, so it
is admitted as a hostname or a bracketed IP literal and refused if it carries a port, credentials
or a path — see *On reading the environment* for what an unchecked one did.

`POSTGRES_HOST` and `POSTGRES_PORT`, defaulted to the compose service and `5432`, are what an
explicit `DATABASE_URL` used to be — the escape hatch for a database that is not this one. They are
half of that move and it is worth being exact about which half: they point the *client* elsewhere,
and the compose files still define `db` and still make `app` wait for it to report healthy. An
overlay cannot delete a service the base file declares, so a database outside this project means
removing that service and its `depends_on` from the files, not setting two variables. The variables
are what make the application portable; the compose topology is a separate edit.

The second is the address the app's port publishes on: `127.0.0.1` on the VPS so that only the proxy
can reach it, `0.0.0.0` locally so that `docker compose up` answers on the host. Compose appends
port mappings across files rather than replacing them, so the overlay tags the list `!override`;
the bind mount is cleared with `!reset` for the same reason, since a merged mount would otherwise
lay the working tree back over the image's own `/app`. The watch command needs neither: it is the
`dev` stage's `CMD`, and the overlay builds the `runtime` stage, which carries its own.

The `db` service publishes no port in either place. The app reaches it over the compose network, and
so does the Prisma CLI — which needs no container of its own, because it is already inside the
application image: `prisma` is a production dependency there for the entrypoint's sake, so schema
work runs as `docker compose run` against the `app` service. The CLI takes its connection string
from `prisma.config.ts`, which calls the same assembly the application's `database` namespace does,
so one set of credentials serves the application, the entrypoint and the CLI alike and nothing needs
a route in from outside. A migration is a file written into the repository, and it
survives `--rm` because the base file already mounts the working tree over the `app` service's
`/app` — the same mount the watch loop compiles from. That is a property of the development service,
not of the image: an invocation against the `runtime` stage, which carries no mount, would need
`prisma/` bind-mounted explicitly or the new migration would leave with the container.

Three consequences follow, and they are the reason this is not a last step.

- **The seed is not a one-shot.** A redeploy is `docker compose up -d --build` against a named volume
  that survived it, so startup runs a second time against a database that already holds the seed.
  REQ-INIT-02's repeat-start check is therefore the deployment check too, not a formality.
- **Losing the volume is not losing the content.** Every row lives in `prisma/migrations/`, so a
  fresh volume replays the schema migration, the seed migration and any later content migration and
  lands in the same state. Self-hosting a database would normally attach a backup obligation to
  REQ-DELIV-01; *On filling the database* cancels it — recovery is `docker compose down -v` followed
  by a start. This is the decision paying for itself a second time.
- **The uptime is ours.** No platform sleeps the instance, and no free tier expires the database —
  the two failure modes that would have killed the README link silently. In exchange the VPS itself
  is now the single point of failure, so both services carry `restart: unless-stopped` and Docker is
  enabled at boot. That policy composes with the entrypoint rather than contradicting it: an
  unreachable database still exits non-zero, exactly as REQ-INIT-01 requires, and the restart policy
  only decides what happens next — a database slow to come back heals without a visit.

`PORT` and the `POSTGRES_*` variables still come from the environment. Nothing about a VPS requires
it, but a container that reads its port and its database credentials from the outside is the one that
stays portable, and the cost is zero.

---

## Report format

At the end of the work, generate `docs/requirements/COMPLIANCE_REPORT.md` covering **every** ID above,
in the same order. One heading per requirement group, one section per requirement:

```markdown
### REQ-INIT-01 — ✅ Met

> При запуске приложения база данных должна быть автоматически подготовлена и заполнена Вашими данными.

**Implementation:** `docker-entrypoint.sh:4` runs `prisma migrate deploy` before the image's `CMD`.
**Evidence:** `docker compose up --build` on a pruned volume — log excerpt showing the migration applied.
```

Rules for the report:

- Status is one of `✅ Met`, `⚠️ Partially met`, `❌ Not met` or `Withdrawn`. No other
  values. `Withdrawn` is not a compliance verdict and is not subject to the evidence rules below:
  it applies only to an ID this document marks as withdrawn, never to a requirement that merely
  lacks evidence.
- Every entry quotes the assignment verbatim from [ASSIGNMENT.md](./ASSIGNMENT.md) — never a paraphrase.
- A withdrawn ID keeps its section and says why it was withdrawn — never silently disappears.
- **Evidence** is a real artifact: a command that was actually run with its output, a `file:line`
  reference, or a GraphQL response. Never a claim without one.
- A requirement with no evidence is `⚠️` or `❌`, never `✅`.
- Where the assignment states the same thing twice — once as a requirement, once as a criterion —
  the second entry keeps its own quote but replaces the evidence block with a `**Covered by:**` line
  naming the ID that carries it. This is allowed only when that evidence really proves both; then the
  entry may be `✅`, since the artifact exists, it just is not reprinted. Repeating an artifact to
  fill a section is exactly the padding REQ-EVAL-01 warns about.
- Close with a summary table: total requirements, met, partially met, not met, withdrawn. Withdrawn
  IDs are counted in the total and in their own column, never silently dropped from either.
