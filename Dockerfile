# syntax=docker/dockerfile:1

# ---- base --------------------------------------------------------------------------------------
# Pinned to a minor rather than the floating `22-slim`: REQ-EVAL-07 is a claim about a build that
# works from scratch, and a tag that moves under it is the cheapest way to make that claim false.
#
# The Prisma schema engine behind `migrate deploy` is a native binary linked against libssl, and
# node:*-slim carries no OpenSSL at all — the CLI then guesses a version and loads the wrong
# engine. Debian-slim rather than Alpine is a glibc choice and not a Prisma one; Alpine works and is
# 83 MB smaller. See "On filling the database" in docs/requirements/REQUIREMENTS.md.
FROM node:22.22-slim AS base

RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# ---- deps --------------------------------------------------------------------------------------
# Every dependency, dev included. Keyed on the manifests alone, so editing a source file does not
# reinstall anything. Both `build` and `dev` start from here.
FROM base AS deps

COPY package.json package-lock.json ./
RUN npm ci

# ---- dev ---------------------------------------------------------------------------------------
# The watch-mode target uses the repository and node_modules volumes from docker-compose.yml.
FROM deps AS dev

ENV NODE_ENV=development

# Not `nest start --watch`: its watcher spawns the rebuilt process without killing the running one,
# so every restart dies on EADDRINUSE and the stale process keeps serving — a change that silently
# never takes effect. `node --watch` owns a single process and replaces it. The wait is for
# `nest build --watch`, which begins by deleting dist/.
#
# Two things then keep it alive, and neither is sufficient alone. `--watch-path` is what makes
# recovery possible at all: by default `node --watch` watches the modules it managed to load, so a
# process that failed to load its entry file watches nothing and sits in "waiting for file changes"
# for good — even once the file is back. It does not exit, so no supervisor notices. Naming ./dist
# explicitly decouples the watch from the load. The loop covers the other half: if dist/ itself is
# gone, the watch path cannot be attached and node exits, so the loop waits for the tree and
# respawns. Together they turn any wipe of the bind-mounted dist/ — a stray build, a clean task —
# from a container that stays up with a permanently dead application into half a second.
#
# The loop is conditioned on the builder still being alive (`kill -0`) for the failure the two
# above do not cover: `nest build --watch` dying leaves a valid dist/ from its last good compile,
# so node keeps serving and the health check keeps passing while every later edit is silently
# ignored. Exiting instead hands the container to `restart: unless-stopped`, which is loud.
CMD ["npm", "run", "start:dev"]

# ---- build -------------------------------------------------------------------------------------
FROM deps AS build

# tsconfig.build.json comes along because `nest build` prefers it over tsconfig.json when it is
# present and falls back silently when it is not — and the fallback compiles the specs, which is
# how a *.spec.js ends up in the image dist/ that the runtime stage copies.
COPY tsconfig.json tsconfig.build.json nest-cli.json ./
COPY src ./src
RUN npm run build

# ---- runtime -----------------------------------------------------------------------------------
FROM base AS runtime

ENV NODE_ENV=production

# `prisma` remains a production dependency because the runtime entrypoint will run migrations.
COPY package.json package-lock.json ./

RUN npm ci --omit=dev \
    && npm cache clean --force \
    && ./node_modules/.bin/prisma --version > /dev/null

COPY --from=build /app/dist ./dist

USER node

# Exec form on purpose: node becomes PID 1 and Docker signals it directly, which is what makes
# `enableShutdownHooks()` in src/main.ts reachable. A shell form would leave sh holding PID 1.
#
# The M3 database work adds the rest of what "On filling the database" in
# docs/requirements/REQUIREMENTS.md describes for this stage, and none of it exists yet: the
# entrypoint running `prisma migrate deploy`, the copied `prisma/` directory and `prisma.config.ts`,
# the prune of the query compilers for the four databases this project never uses, and the removal
# of npm/npx/yarn. That list is the checklist for this stage, not a description of it.
CMD ["node", "dist/main.js"]
