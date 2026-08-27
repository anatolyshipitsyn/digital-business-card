# Digital Business Card — Agent Guide

A take-home assignment: a backend "digital business card" that presents me as a specialist.
Required stack, no substitutions: Git · TypeScript · Node.js · NestJS · Prisma · GraphQL · Docker.

## Where the truth lives

Read these before any code change — this file deliberately does not restate them:

| File | What it holds |
| --- | --- |
| [`docs/requirements/ASSIGNMENT.md`](docs/requirements/ASSIGNMENT.md) | The assignment verbatim. The citation source; never edited, never translated. |
| [`docs/requirements/REQUIREMENTS.md`](docs/requirements/REQUIREMENTS.md) | Numbered requirements (`REQ-*`) with verification, the reference GraphQL query read as a contract, and the design decisions taken within it — including the ones the assignment leaves open, such as the database. |
| [`README.md`](README.md) | What a reviewer sees first: one start command and the Sandbox link. |

Where any two disagree, the assignment wins. Claude Code reads `CLAUDE.md`, which imports this file;
Codex reads this file directly.

## Rules for agents

- Weigh every architectural choice against the evaluation criteria (`REQ-EVAL-*`) before speed.
- Do not add features beyond the assignment — excess scope counts against, not for (`REQ-EVAL-01`).
- Keep the README current as the work lands; a `Pending` block left in it fails `REQ-DELIV-02`.
- Write all repository files — code, docs, comments, commit messages — in English.
- Requirement IDs are stable: add or withdraw, never renumber, never edit the assignment.
- When the work is finished, produce `docs/requirements/COMPLIANCE_REPORT.md` exactly as the
  "Report format" section of `REQUIREMENTS.md` prescribes. No evidence, no `✅`.
