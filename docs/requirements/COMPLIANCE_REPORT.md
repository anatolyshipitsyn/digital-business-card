# Compliance report — M1 checkpoint

This is an interim report for M1, not the deliverable. `AGENTS.md` and `ROADMAP.md` place the
report that gets reviewed at M6, once every requirement has its evidence; this one exists to keep
the evidence attached to the milestone that produced it rather than reconstructed at the end.
Requirements owned by later milestones remain open until their specified evidence exists.

Every `**Evidence:**` line below is either a command with its actual output or a `file:line`
reference that resolves in the tree as committed. Line numbers are the ones this milestone leaves
behind; re-check them when the files move.

## Technology stack

### REQ-STACK-01 — ⚠️ Partially met

> Создайте Вашу цифровую визитку (backend-приложение), которая презентует Вас как специалиста, с обязательным использованием следующих технологий:
>
> - Git;

**Implementation:** The repository is under Git and its messages name changes rather than checkpoints.
**Evidence:** `git log --oneline`:

```
318496e docs: describe the project in the README
9667dac chore: declare the environment contract and the ignore rules
0bb82b4 docs: add the agent guide and the build roadmap
b052a32 docs: record the assignment and derive numbered requirements
c4f3710 Initial commit
```

Not `✅` yet, for two reasons the verification names: the entire M1 change set is staged and not
committed, so none of the code this report describes is in that history; and `Initial commit` is the
checkpoint-style message the verification rules out. ROADMAP.md schedules the final reading of this
requirement after the last commit, at M6.

### REQ-STACK-02 — ✅ Met

> - TypeScript;

**Implementation:** TypeScript sources and `strict: true` are present in `src/` and `tsconfig.json`.
**Evidence:** `npm run lint` and `npm run build` both exited 0; `tsconfig.json:22` sets `strict`.

### REQ-STACK-03 — ✅ Met

> - Node.js;

**Implementation:** `package.json:7-9` declares `engines.node` `>=22.12.0`; `Dockerfile:11` pins the
base image to `node:22.22-slim`.
**Evidence:** `docker compose exec app node --version` → `v22.22.3`, inside the declared range.

### REQ-STACK-04 — ✅ Met

> - NestJS;

**Implementation:** `src/main.ts:1-27` bootstraps `AppModule` with `NestFactory`; `src/app.module.ts:1-10`
declares it and imports `HealthModule`.
**Evidence:** `docker compose logs app` → `[NestApplication] Nest application successfully started`.

### REQ-STACK-05 — ⚠️ Partially met

> - Prisma;

**Implementation:** Prisma dependencies are declared, but the schema and generated client are deferred to M2.
**Evidence:** `package.json:21-22` declares `@prisma/client` and `prisma` at `7.10.0`; the CLI answers
inside the app image — `docker compose run --rm --entrypoint ./node_modules/.bin/prisma app --version`
→ `prisma : 7.10.0`. `ls prisma` → `No such file or directory`: no schema yet.

### REQ-STACK-06 — ⚠️ Partially met

> - GraphQL;

**Implementation:** GraphQL is planned for M4 and is not present in the M1 skeleton.
**Evidence:** `ROADMAP.md:64-74`; no GraphQL module exists under `src/`.

### REQ-STACK-07 — ✅ Met

> - Docker.

**Implementation:** `Dockerfile` and `docker-compose.yml` define the application and PostgreSQL services.
**Evidence:** `docker compose ps`:

```
SERVICE   IMAGE                       STATUS
app       digital-business-card-app   Up 15 seconds (healthy)
db        postgres:18.6-alpine        Up 47 seconds (healthy)
```

Only the `dev` stage is evidenced. The `runtime` stage has never been built, so `REQ-EVAL-07` below
records that gap rather than this entry claiming it.

## GraphQL surface

### REQ-API-01 — ❌ Not met

> Приложение должно предоставлять Apollo Sandbox (GraphQL Playground), через которое можно получить информацию о Вас, Вашем опыте работы, навыках и проектах.

**Implementation:** GraphQL and Apollo Sandbox are deferred to M4.
**Evidence:** `src/` contains only the health module; no GraphQL endpoint is configured.

### REQ-API-02 — ❌ Not met

> Приложение должно предоставлять Apollo Sandbox (GraphQL Playground), через которое можно получить информацию о Вас, Вашем опыте работы, навыках и проектах.

**Implementation:** Profile, experience, skills and projects are deferred to M2–M4.
**Evidence:** No GraphQL resolver or domain data module exists in `src/`.

### REQ-API-03 — ❌ Not met

> API должно позволять получить профиль и связанные с ним данные, например:

**Implementation:** The reference query cannot run before M4.
**Evidence:** No GraphQL endpoint or generated schema exists in the repository.

## Data model

### REQ-DATA-01 — ❌ Not met

> Бэкенд должен содержать:
>
> 1. Профиль:
>    - имя;

**Evidence:** No Prisma schema or seeded profile exists; data model is scheduled for M2–M3.

### REQ-DATA-02 — ❌ Not met

>    - краткое описание;

**Evidence:** No Prisma schema or seeded profile exists; data model is scheduled for M2–M3.

### REQ-DATA-03 — ❌ Not met

>    - ссылки на GitHub/LinkedIn или другие профессиональные ресурсы.

**Evidence:** No Prisma schema or seeded profile exists; data model is scheduled for M2–M3.

### REQ-DATA-04 — ❌ Not met

> 2. Список навыков.

**Evidence:** No Prisma schema or seeded skills exist; data model is scheduled for M2–M3.

### REQ-DATA-05 — ❌ Not met

> 3. Опыт работы:
>    - компания;

**Evidence:** No Prisma schema or seeded experience exists; data model is scheduled for M2–M3.

### REQ-DATA-06 — ❌ Not met

>    - должность;

**Evidence:** No Prisma schema or seeded experience exists; data model is scheduled for M2–M3.

### REQ-DATA-07 — ❌ Not met

>    - период работы;

**Evidence:** No Prisma schema or seeded experience exists; data model is scheduled for M2–M3.

### REQ-DATA-08 — ❌ Not met

>    - Ваши достижения.

**Evidence:** No Prisma schema or seeded experience exists; data model is scheduled for M2–M3.

### REQ-DATA-09 — ❌ Not met

> 4. Проекты:
>    - название;

**Evidence:** No Prisma schema or seeded projects exist; data model is scheduled for M2–M3.

### REQ-DATA-10 — ❌ Not met

>    - ссылка на проект/репозиторий.

**Evidence:** No Prisma schema or seeded projects exist; data model is scheduled for M2–M3.

## Database initialization

### REQ-INIT-01 — ❌ Not met

> При запуске приложения база данных должна быть автоматически подготовлена и заполнена Вашими данными.

**Implementation:** Startup migrations are deferred to M3/M5.
**Evidence:** `Dockerfile:79-84` lists the entrypoint and `prisma/` copy as M3 work still outstanding;
`ls prisma` → `No such file or directory`, so there is no migration directory to run.

### REQ-INIT-02 — ❌ Not met

> При запуске приложения база данных должна быть автоматически подготовлена и заполнена Вашими данными.

**Implementation:** Startup seeding is deferred to M3/M5.
**Evidence:** No seed migration or application database integration exists.

### REQ-INIT-03 — Withdrawn

> При запуске приложения база данных должна быть автоматически подготовлена и заполнена Вашими данными.

**Implementation:** Withdrawn in `REQUIREMENTS.md`; repeat-start idempotency is covered by REQ-INIT-02.
**Evidence:** `REQUIREMENTS.md:218` marks this ID withdrawn.

## Architecture

### REQ-ARCH-01 — ⚠️ Partially met

> Конкретную структуру GraphQL API, базы данных и архитектуру приложения выберите самостоятельно.

**Implementation:** The module skeleton and design decisions are documented; schema and GraphQL layers remain open.
**Evidence:** `src/app.module.ts:1-10` and `REQUIREMENTS.md` design notes.

### REQ-ARCH-02 — ⚠️ Partially met

> Бизнес-логика, работа с данными и GraphQL API должны иметь разумное разделение ответственности.

**Implementation:** The health concern is isolated in `HealthModule`; business/data/API layers are deferred.
**Evidence:** `src/app.module.ts:3-8`, `src/health/health.module.ts:1-10`.

## Evaluation criteria

### REQ-EVAL-01 — ⚠️ Partially met

> - в первую очередь оценивается не количество написанного кода, а качество инженерных решений.

**Evidence:** `git diff HEAD --stat -- src/` — the whole application is four files and 63 lines:

```
 src/app.module.ts               | 10 ++++++++++
 src/health/health.controller.ts | 16 ++++++++++++++++
 src/health/health.module.ts     | 10 ++++++++++
 src/main.ts                     | 27 +++++++++++++++++++++++++++
 4 files changed, 63 insertions(+)
```

Nothing in it is unreferenced: `main.ts` bootstraps `AppModule`, which imports `HealthModule`, whose
controller answers the probe `docker-compose.yml` actually runs. The one item that looked like
excess — the `overrides` entry pinning `deepmerge-ts` past what `@prisma/config` declares — was
checked and kept: it carries GHSA-ggr8-5vv4-36mx out of the production dependency set, and the
reasoning is now recorded under *On the one `overrides` entry* in `REQUIREMENTS.md`.
**Evidence:** `npm audit` → `found 0 vulnerabilities`. The final scope review belongs to M5.

### REQ-EVAL-02 — ⚠️ Partially met

> - структуру приложения и разделение ответственности;

**Covered by:** REQ-ARCH-02. M1 only evidences the health module boundary.

### REQ-EVAL-03 — ❌ Not met

> - работу GraphQL с вложенными данными;

**Evidence:** GraphQL and Prisma query logging are deferred to M2–M4; no SQL statement count exists.

### REQ-EVAL-04 — ⚠️ Partially met

> - взаимодействие с базой данных;

**Evidence:** PostgreSQL is healthy in `docker compose ps`, but Prisma schema, relations and lifecycle are deferred.

### REQ-EVAL-05 — ❌ Not met

> - инициализацию и заполнение базы данных;

**Covered by:** REQ-INIT-01 and REQ-INIT-02; neither has startup migration/seed evidence yet.

### REQ-EVAL-06 — ⚠️ Partially met

> - читаемость и поддерживаемость кода;

**Evidence:** `npm run lint` (`eslint . --max-warnings 0`) and `npm run build` both exited 0. Tests
and the later layers are not yet present.

### REQ-EVAL-07 — ⚠️ Partially met

> - корректную работу приложения после запуска с нуля.

**Evidence:** both services report `healthy` in `docker compose ps` (quoted under REQ-STACK-07) with
no `.env` present, and `curl http://127.0.0.1:3000/health` → `{"status":"ok","info":{},"error":{},"details":{}}`.

The start was made from a genuinely clean state: `docker compose down -v && docker compose up --build`
removed both named volumes and rebuilt the image. The `initdb` race the health checks exist to cover
is therefore exercised, and the gate held — `db` reported `Healthy` before `app` was started:

```
Volume digital-business-card_db-data Removed
Volume digital-business-card_app-node-modules Removed
...
db-1  | 2026-08-28 06:25:53.515 UTC [1] LOG:  database system is ready to accept connections
 Container digital-business-card-db-1 Healthy
 Container digital-business-card-app-1 Starting
app-1  | [Nest] 43  LOG [NestApplication] Nest application successfully started
```

The `runtime` stage builds too — `docker build --target runtime` succeeds, with `npm ci --omit=dev`
resolving `prisma` from the production dependency set and the stage asserting the CLI starts.

One part is still open: the coverage query needs M4. And what is proven is that the image *builds*,
not that it *runs* — the runtime container has not been started, because before M3 it has no
entrypoint and no schema to serve.

## Deliverables

### REQ-DELIV-01 — ❌ Not met

> 1. Ссылку на проект (для просмотра);

**Evidence:** No deployed project URL exists in `README.md`.

### REQ-DELIV-02 — ❌ Not met

> 2. Ссылку на Git (для ознакомления с исходным кодом).

**Evidence:** `README.md:11-17` still contains `Pending` blocks for the start command and Sandbox links.

## Summary

| Total | Met | Partially met | Not met | Withdrawn |
| ---: | ---: | ---: | ---: | ---: |
| 34 | 4 | 10 | 19 | 1 |
