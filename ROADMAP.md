# Roadmap

How this project gets built, milestone by milestone: what each one delivers, and what has to hold
before it is closed.

This file tracks progress. It does not define requirements and does not restate how they are
verified — [`docs/requirements/REQUIREMENTS.md`](docs/requirements/REQUIREMENTS.md) owns both, and
[`AGENTS.md`](AGENTS.md) says where the rest of the truth lives. Exit criteria below name a
requirement by ID rather than paraphrasing it, so the two documents cannot drift apart. Criteria
without an ID are checks this schedule adds for its own sake; nothing in the numbered set depends
on them.

## Ordering

Milestones run in order. Two properties of that order are deliberate.

**The schema comes before the content.** Which fields exist is settled before the milestones
begin: by the reference query, which is quoted source and cannot be edited, and by the modelling
decisions recorded under `REQ-DATA-*`. So the data model does not wait on what gets written into
it, and once the model exists, collecting the content is filling known fields.

**The seed is the last thing that gets cheap.** From M3 the content lives in the migration queue.
Applied migrations are recorded in `_prisma_migrations` and skipped on every later start, which is
what makes the repeat-start guarantee free, and what makes correcting a sentence a new migration
with an `UPDATE` rather than an edit to a file. Locally the escape is still a reset that replays
the queue; it stops being an escape at the first deploy. Schema mistakes are therefore cheapest
before M3 and costly after it.

Development runs against real PostgreSQL from M1, because that is what production runs. The reasons
PostgreSQL was chosen, and what depends on it, are in *On the database* in `REQUIREMENTS.md`.

## M1 — The skeleton runs

A NestJS application that starts, and a PostgreSQL container that reports itself healthy. Nothing
talks to anything yet.

**Exit criteria**

- [x] `docker compose up --build` brings `db` and `app` to `healthy` with no `.env` present, and
      the application answers on the port given by `PORT`
- [x] `docker compose up -d db` reaches state `healthy`
- [x] `package.json` declares `engines.node`
- [x] Host-side access to the compose database is settled, so that `prisma` commands can run at all
- [x] `REQ-STACK-02` verifies

## M2 — Schema and data access

The Prisma data model and the layer that owns it: profile, links, skills, experience and projects,
with the relations between them, behind a module that manages the connection lifecycle. Query
logging is wired in here rather than later, because `REQ-EVAL-03` is evidenced from it.

**Exit criteria**

- [x] `prisma migrate deploy` creates the schema on an empty database
- [x] `npm run lint` exits clean
- [x] `REQ-EVAL-04` verifies

## M3 — The data is seeded

My real content — name, description, professional links, skills, work history with achievements,
projects — written into a data migration that runs in the same queue as the schema migration.
Collecting the content belongs here: it must be complete before the migration is authored, because
authoring it is what commits the content to the queue.

The entrypoint lands here too, for the reason the image landed at M1: the mechanism is already
settled — *On preparing the schema* and *On filling the database* in `REQUIREMENTS.md` commit to
`prisma migrate deploy` and to the seed being a migration — so once the queue holds the content, the
shortest way to exercise it is the command that will run it in production. Writing the script later
would mean checking the seed through `docker compose run` here and then checking it again through a
different code path at M5.

The requirements this milestone exists for, `REQ-INIT-01` and `REQ-INIT-02`, are still not verified
here. Both are claims about a start from nothing, evidenced by a log excerpt from a clean clone and
an unused volume, and capturing that evidence is what M5 is for; produced a milestone early it would
be reproduced there rather than cited. What M3 owns is that the migration is correct and that
startup runs it.

**Exit criteria**

- [x] `prisma migrate deploy` applies the seed on a fresh database
- [x] A second run reports no pending migrations and leaves the data unduplicated
- [x] Every column the model defines holds real content, with no placeholder text. That it is
      also *retrievable* is proven by the coverage query at M4, not here
- [x] The entrypoint applies the queue before the application command, in both image targets, so a
      start needs no migration step of its own. That it holds *from nothing*, and what an
      unreachable database does to it, are `REQ-INIT-01` and `REQ-INIT-02` at M5

## M4 — The GraphQL API

Domain services holding the business logic, and a code-first GraphQL layer above them serving Apollo
Sandbox. Related collections resolve as fields, so nesting is handled by the schema rather than by
one eager query shape.

**Exit criteria**

- [x] `REQ-API-03` verifies — the reference query from `ASSIGNMENT.md`, pasted unchanged
- [x] `REQ-DATA-01`–`REQ-DATA-10` verify — the coverage query from `REQUIREMENTS.md` returns
      data at every path, including `links`, `startDate`/`endDate` and `achievements`, which the
      reference query never selects
- [x] `REQ-API-01` and `REQ-API-02` verify against the local endpoint; the production-mode half of
      `REQ-API-01` repeats at M5, where the image exists
- [x] `REQ-ARCH-02` verifies
- [x] `REQ-EVAL-03` verifies
- [x] `REQ-EVAL-06` verifies

## M5 — It works from scratch

The packaging itself landed early and in two pieces: the image and the `app` service beside the
database in the same Compose file at M1, when running the Prisma CLI through the application image
removed the need for a container of its own, and the entrypoint at M3, beside the queue it applies.
What M5 owns is proving it: that a machine holding no prior state starts the whole thing with one
command. The entrypoint and the runtime image carry failures that appear nowhere else: an unprepared
schema, a signal that never reaches the process, a CLI absent from the production dependency set. So
this milestone proves the packaging, not only the behaviour. What is measured here is what the
compliance report quotes, so evidence is captured as it is produced rather than reconstructed at M6.

**Exit criteria**

- [x] `REQ-EVAL-07` verifies — including the clean clone and the coverage query, both of which
      `down -v` alone does not establish
- [x] `REQ-INIT-01` verifies, negative case included
- [x] `REQ-INIT-02` verifies
- [x] `REQ-API-01` verifies again against the containerised endpoint under `NODE_ENV=production`
- [x] `REQ-STACK-03` and `REQ-STACK-07` verify
- [x] `REQ-EVAL-01` verifies — the diff reviewed for abstractions and features nothing asked for
- [x] `docker compose stop app` returns promptly, showing the signal reaches the process
- [x] Every artifact the report will cite is saved where it can cite it

## M6 — Delivered

A running instance a reviewer can open, and a repository they can read.

**Exit criteria**

- [ ] `REQ-DELIV-01` verifies
- [ ] `REQ-DELIV-02` verifies, from a session that is not logged in
- [ ] `REQ-STACK-01` verifies, read after the final commit
- [ ] `REQ-ARCH-01` verifies
- [ ] `docs/requirements/COMPLIANCE_REPORT.md` follows the *Report format* section of
      `REQUIREMENTS.md` and covers every requirement ID, withdrawn ones included
