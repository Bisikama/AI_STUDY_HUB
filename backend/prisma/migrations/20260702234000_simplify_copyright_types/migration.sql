-- Map AUTHORIZED, FPT_OFFICIAL, THIRD_PARTY to UNKNOWN
-- Also clear their declaredAt and declaredBy per business rules
UPDATE "documents"
SET 
  "copyright_source_type" = 'UNKNOWN',
  "copyright_declared_at" = NULL,
  "copyright_declared_by" = NULL
WHERE "copyright_source_type" IN ('AUTHORIZED', 'FPT_OFFICIAL', 'THIRD_PARTY');

-- Safely recreate the enum in PostgreSQL
ALTER TYPE "CopyrightSourceType" RENAME TO "CopyrightSourceType_old";
CREATE TYPE "CopyrightSourceType" AS ENUM ('OWN_ORIGINAL', 'OPEN_LICENSE', 'UNKNOWN');

-- Drop default before altering column type
ALTER TABLE "documents" ALTER COLUMN "copyright_source_type" DROP DEFAULT;

-- Alter column to use new enum type
ALTER TABLE "documents" 
  ALTER COLUMN "copyright_source_type" TYPE "CopyrightSourceType" 
  USING ("copyright_source_type"::text::"CopyrightSourceType");

-- Re-add default
ALTER TABLE "documents" ALTER COLUMN "copyright_source_type" SET DEFAULT 'UNKNOWN';

-- Drop old enum
DROP TYPE "CopyrightSourceType_old";
