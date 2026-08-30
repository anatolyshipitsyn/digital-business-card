-- The curated order of the three collections that have no natural one, taken from the order the
-- seed migration lists them in. `Experience` is absent on purpose: it is ordered by startDate.
--
-- The default is a per-table sequence rather than a constant, so a row inserted without a position
-- lands after everything already numbered instead of colliding on one value. Note what a sequence
-- is and is not: it hands out the next value it has ever issued, per table, not `max + 1` per
-- profile. With one profile, and rows arriving only through migrations, the two coincide; a
-- trigger computing a true per-profile maximum would be invisible to schema.prisma and drift from
-- it, which is a worse trade than the difference is worth.
--
-- No unique constraint: the services break ties on the visible column, so duplicates still order
-- reproducibly, and a constraint would only make a future reordering fight the database
-- mid-transaction.

-- AlterTable
ALTER TABLE "Link" ADD COLUMN     "sortOrder" INTEGER NOT NULL DEFAULT 0;
CREATE SEQUENCE link_sortorder_seq;
ALTER TABLE "Link" ALTER COLUMN "sortOrder" SET DEFAULT nextval('link_sortorder_seq');
ALTER SEQUENCE link_sortorder_seq OWNED BY "Link"."sortOrder";

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "sortOrder" INTEGER NOT NULL DEFAULT 0;
CREATE SEQUENCE project_sortorder_seq;
ALTER TABLE "Project" ALTER COLUMN "sortOrder" SET DEFAULT nextval('project_sortorder_seq');
ALTER SEQUENCE project_sortorder_seq OWNED BY "Project"."sortOrder";

-- AlterTable
ALTER TABLE "Skill" ADD COLUMN     "sortOrder" INTEGER NOT NULL DEFAULT 0;
CREATE SEQUENCE skill_sortorder_seq;
ALTER TABLE "Skill" ALTER COLUMN "sortOrder" SET DEFAULT nextval('skill_sortorder_seq');
ALTER SEQUENCE skill_sortorder_seq OWNED BY "Skill"."sortOrder";

UPDATE "Link" AS t SET "sortOrder" = v."sortOrder"
FROM (VALUES
    ('link-github',   1),
    ('link-linkedin', 2),
    ('link-telegram', 3),
    ('link-cv',       4)
) AS v("id", "sortOrder")
WHERE t."id" = v."id";

UPDATE "Skill" AS t SET "sortOrder" = v."sortOrder"
FROM (VALUES
    ('skill-typescript',      1),
    ('skill-nodejs',          2),
    ('skill-nestjs',          3),
    ('skill-graphql',         4),
    ('skill-prisma',          5),
    ('skill-typeorm',         6),
    ('skill-postgresql',      7),
    ('skill-redis',           8),
    ('skill-elasticsearch',   9),
    ('skill-mongodb',        10),
    ('skill-react',          11),
    ('skill-react-native',   12),
    ('skill-nextjs',         13),
    ('skill-ant-design',     14),
    ('skill-tailwind-css',   15),
    ('skill-bullmq',         16),
    ('skill-temporal',       17),
    ('skill-n8n',            18),
    ('skill-mcp',            19),
    ('skill-aws-lambda',     20),
    ('skill-serverless',     21),
    ('skill-terraform',      22),
    ('skill-docker',         23),
    ('skill-gitlab-ci',      24),
    ('skill-github-actions', 25),
    ('skill-rest-apis',      26),
    ('skill-etl-pipelines',  27)
) AS v("id", "sortOrder")
WHERE t."id" = v."id";

UPDATE "Project" AS t SET "sortOrder" = v."sortOrder"
FROM (VALUES
    ('project-dailymark',             1),
    ('project-securecore',            2),
    ('project-digital-business-card', 3),
    ('project-workspace-plugins',     4)
) AS v("id", "sortOrder")
WHERE t."id" = v."id";

-- The ids above are literals shared with the seed migration. A row the UPDATEs never matched keeps
-- the placeholder 0 the column was added with, which no error would report and which would quietly
-- collapse that list's order onto its alphabetical tie-breaker. Checked here rather than trusted.
DO $$
DECLARE unnumbered integer;
BEGIN
  SELECT (SELECT count(*) FROM "Link" WHERE "sortOrder" = 0)
       + (SELECT count(*) FROM "Skill" WHERE "sortOrder" = 0)
       + (SELECT count(*) FROM "Project" WHERE "sortOrder" = 0)
    INTO unnumbered;

  IF unnumbered > 0 THEN
    RAISE EXCEPTION '% row(s) were left unnumbered: an id this migration updates is not in the seed.', unnumbered;
  END IF;
END $$;

-- Move each sequence past the numbers just written, so the next insert continues the list rather
-- than restarting it. Read from the data rather than hardcoded, so this stays correct if the seed
-- ever grows.
SELECT setval('link_sortorder_seq',    (SELECT max("sortOrder") FROM "Link"));
SELECT setval('skill_sortorder_seq',   (SELECT max("sortOrder") FROM "Skill"));
SELECT setval('project_sortorder_seq', (SELECT max("sortOrder") FROM "Project"));
