/*
  Warnings:

  - The values [PROCESSING,AVAILABLE,FAILED,DELETED] on the enum `DocumentStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "DocumentStatus_new" AS ENUM ('PRIVATE', 'PENDING', 'APPROVED');
ALTER TABLE "public"."documents" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "documents" ALTER COLUMN "status" TYPE "DocumentStatus_new" USING ("status"::text::"DocumentStatus_new");
ALTER TYPE "DocumentStatus" RENAME TO "DocumentStatus_old";
ALTER TYPE "DocumentStatus_new" RENAME TO "DocumentStatus";
DROP TYPE "public"."DocumentStatus_old";
ALTER TABLE "documents" ALTER COLUMN "status" SET DEFAULT 'PRIVATE';
COMMIT;

-- AlterTable
ALTER TABLE "documents" ALTER COLUMN "status" SET DEFAULT 'PRIVATE';
