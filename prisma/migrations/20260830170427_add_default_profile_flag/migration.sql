-- The flag that makes the profile row addressable. Schema and data in one migration on purpose:
-- the column is meaningless until exactly one row carries it, and a queue that could stop between
-- the two would leave a database whose root query finds nothing.
--
-- Nullable and unique rather than `Boolean @default(false)`: PostgreSQL treats nulls as distinct in
-- a unique index, so every other row can hold null and at most one can hold `true` — the database
-- enforces the invariant the root query depends on. The index leaves one slot per distinct value,
-- so it would admit a single `false` beside that row; none is ever written, because null already
-- says "not the default". The alternative, a partial index `... WHERE "isDefault"`, is the textbook
-- form and cannot be declared in schema.prisma, so it would leave the schema drifting from the
-- database it describes.

-- AlterTable
ALTER TABLE "Profile" ADD COLUMN     "isDefault" BOOLEAN;

-- CreateIndex
CREATE UNIQUE INDEX "Profile_isDefault_key" ON "Profile"("isDefault");

UPDATE "Profile" SET "isDefault" = true WHERE "id" = 'anatoly-shipitsyn';

-- The id above is a literal shared with the seed migration, and nothing but this check holds the
-- two together. Without it a renamed id would leave the queue succeeding and the column empty, so
-- the failure would surface as a NOT_FOUND on the reviewer's first query rather than on deploy —
-- the same class of quiet failure `set -e` in the entrypoint exists to rule out.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM "Profile" WHERE "isDefault") THEN
    RAISE EXCEPTION 'No profile carries isDefault: the id this migration updates is not in the seed.';
  END IF;
END $$;
