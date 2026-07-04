-- CreateEnum
CREATE TYPE "CopyrightSourceType" AS ENUM ('OWN_ORIGINAL', 'OPEN_LICENSE', 'AUTHORIZED', 'FPT_OFFICIAL', 'THIRD_PARTY', 'UNKNOWN');

-- AlterTable
ALTER TABLE "documents" ADD COLUMN "copyright_source_type" "CopyrightSourceType" NOT NULL DEFAULT 'UNKNOWN',
ADD COLUMN "copyright_author_name" VARCHAR(255),
ADD COLUMN "copyright_source_url" VARCHAR(512),
ADD COLUMN "copyright_license" VARCHAR(100),
ADD COLUMN "copyright_attribution" TEXT,
ADD COLUMN "copyright_permission_reference" TEXT,
ADD COLUMN "copyright_declared_at" TIMESTAMP(3),
ADD COLUMN "copyright_declared_by" UUID;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_copyright_declared_by_fkey" FOREIGN KEY ("copyright_declared_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
