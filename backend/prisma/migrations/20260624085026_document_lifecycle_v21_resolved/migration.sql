-- CreateEnum
CREATE TYPE "VisibilityStatus" AS ENUM ('PRIVATE', 'PENDING_REVIEW', 'PUBLIC');

-- CreateEnum
CREATE TYPE "DeletionStatus" AS ENUM ('ACTIVE', 'SOFT_DELETED', 'DELETING', 'DELETE_FAILED', 'REMOVED');

-- CreateEnum
CREATE TYPE "ExtractionStatus" AS ENUM ('PENDING', 'READY', 'FAILED');

-- CreateEnum
CREATE TYPE "AIStatus" AS ENUM ('NOT_REQUESTED', 'PROCESSING', 'READY', 'FAILED');

-- AlterTable
ALTER TABLE "documents" ADD COLUMN     "ai_attempt_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "ai_failure_reason" TEXT,
ADD COLUMN     "ai_generated_at" TIMESTAMP(3),
ADD COLUMN     "ai_processing_started_at" TIMESTAMP(3),
ADD COLUMN     "ai_run_id" TEXT,
ADD COLUMN     "ai_status" "AIStatus" NOT NULL DEFAULT 'NOT_REQUESTED',
ADD COLUMN     "deletion_status" "DeletionStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "extraction_status" "ExtractionStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "storage_path" VARCHAR(512),
ADD COLUMN     "visibility_status" "VisibilityStatus" NOT NULL DEFAULT 'PRIVATE';

-- AlterTable
ALTER TABLE "subjects" ALTER COLUMN "is_system" SET DEFAULT false;

-- CreateTable
CREATE TABLE "document_chunks" (
    "id" UUID NOT NULL,
    "document_id" UUID NOT NULL,
    "chunk_index" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "char_start" INTEGER NOT NULL,
    "char_end" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_chunks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "document_chunks_document_id_idx" ON "document_chunks"("document_id");

-- CreateIndex
CREATE UNIQUE INDEX "document_chunks_document_id_chunk_index_key" ON "document_chunks"("document_id", "chunk_index");

-- AddForeignKey
ALTER TABLE "document_chunks" ADD CONSTRAINT "document_chunks_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
