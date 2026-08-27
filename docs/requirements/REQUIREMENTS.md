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
  unique key — a slug the seed writes and the resolver reads, never "whichever row comes back first".
  How that row is written is decided under REQ-INIT-02.
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
expensive kind of failure to diagnose. And `exec node dist/main.js`, so the process becomes PID 1 and
receives `SIGTERM` directly; without it the shell holds PID 1, does not forward the signal, and every
restart waits out the ten-second kill timeout.

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

`app` is probed by posting `{__typename}` to the GraphQL endpoint with `node -e` and `fetch`:
`node:*-slim` carries neither `curl` nor `wget`, and pulling a package into the runtime image to run
a health check would be a poor trade. The probe deliberately does not touch the database. A liveness
check that queries Postgres flaps on any transient blip and kills a container that is in fact
healthy, and by the time the application runs at all the migrations have already proven the database
reachable. `@nestjs/terminus` is not added, for the reason it is not needed: one line of compose does
this, while a module plus a dependency is the scope REQ-EVAL-01 counts against.

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
reason; it is not a mistake to be tidied away. The runtime image also keeps `prisma/schema.prisma`
(`migrate deploy` reads the datasource from it), `prisma/migrations/`, and the client generated at
build time with its query engine. The base image is Debian-slim rather than Alpine: Prisma needs a
musl-specific binary target on Alpine, and the mismatch surfaces as a runtime error about a missing
engine — a few megabytes of image is cheaper than that class of bug. Nothing else is added, and in
particular no `ts-node`, `tsx` or `prisma db seed`: with the seed as a migration there is no seed
runner in the image at all.

## 5. Architecture — `REQ-ARCH-*`

> Конкретную структуру GraphQL API, базы данных и архитектуру приложения выберите самостоятельно.
>
> Бизнес-логика, работа с данными и GraphQL API должны иметь разумное разделение ответственности.

| ID | Requirement | Verification |
| --- | --- | --- |
| REQ-ARCH-01 | The concrete GraphQL API structure, database structure and application architecture are chosen by me | The schema, `prisma/schema.prisma` and the module layout exist and are coherent; the reasoning behind them is written down in README / this docs folder |
| REQ-ARCH-02 | Business logic, data access and the GraphQL API are separated into distinct layers | Resolvers hold no business logic; Prisma client is not reached from resolvers |

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

**On resolving the relations.** Each of the profile's four relations — `links`, `skills`,
`experience`, `projects` — is a `@ResolveField`, not a single `findUnique` with `include`. Neither
shape produces an N+1, so that is not what decides it; over-fetching is. An `include` loads all four
relations on every request, including the reference query in [ASSIGNMENT.md](./ASSIGNMENT.md), which
asks for none of the links and none of the achievements. Field resolvers load exactly what the
selection set names, which is what «работа GraphQL с вложенными данными» is asking after.

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

It stays **one** `docker-compose.yml`, not a base file plus a production overlay. REQ-EVAL-07 asks a
reviewer to prove that a from-scratch start works, and that proof is worth less the further what they
start drifts from what answers at REQ-DELIV-01's URL. The two real differences are expressed as
environment instead of as a second file: the address the app's port publishes on — `127.0.0.1` on the
VPS so that only the proxy can reach it, `0.0.0.0` locally so that `docker compose up` answers on the
host — and the values in `.env`. The `db` service publishes no port in either place; the app reaches
it over the compose network, and nothing else needs to.

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

`PORT` and `DATABASE_URL` still come from the environment. Nothing about a VPS requires it, but a
container that reads its port and its connection string from the outside is the one that stays
portable, and the cost is zero.

---

## Report format

At the end of the work, generate `docs/requirements/COMPLIANCE_REPORT.md` covering **every** ID above,
in the same order. One heading per requirement group, one section per requirement:

```markdown
### REQ-INIT-01 — ✅ Met

> При запуске приложения база данных должна быть автоматически подготовлена и заполнена Вашими данными.

**Implementation:** `docker-entrypoint.sh:12` runs `prisma migrate deploy` before `node dist/main.js`.
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
