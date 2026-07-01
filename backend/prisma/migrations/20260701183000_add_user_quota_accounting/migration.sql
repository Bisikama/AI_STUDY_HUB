-- CreateEnum
CREATE TYPE "ReservationStatus" AS ENUM ('PENDING', 'FINALIZED', 'RELEASED');

-- CreateTable
CREATE TABLE "user_storage_usages" (
    "user_id" UUID NOT NULL,
    "quota_bytes" BIGINT NOT NULL,
    "used_bytes" BIGINT NOT NULL,
    "reserved_bytes" BIGINT NOT NULL,
    "trash_bytes" BIGINT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "user_storage_usages_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "storage_reservations" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "document_id" UUID,
    "bytes" BIGINT NOT NULL,
    "status" "ReservationStatus" NOT NULL DEFAULT 'PENDING',
    "expires_at" TIMESTAMP(3) NOT NULL,
    "finalized_at" TIMESTAMP(3),
    "released_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "storage_reservations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "storage_reservations_user_id_status_expires_at_idx" ON "storage_reservations"("user_id", "status", "expires_at");

-- AddForeignKey
ALTER TABLE "user_storage_usages" ADD CONSTRAINT "user_storage_usages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "storage_reservations" ADD CONSTRAINT "storage_reservations_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "storage_reservations" ADD CONSTRAINT "storage_reservations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill data for existing users
INSERT INTO "user_storage_usages" (
    "user_id", "quota_bytes", "used_bytes", "reserved_bytes", "trash_bytes", "created_at", "updated_at"
)
SELECT 
    "id",
    1073741824, -- 1 GiB quota
    COALESCE((
        SELECT SUM("file_size") FROM "documents" d 
        WHERE d."uploaded_by" = users."id" 
          AND d."storage_path" IS NOT NULL 
          AND d."deletion_status" = 'ACTIVE'
    ), 0),
    0,
    COALESCE((
        SELECT SUM("file_size") FROM "documents" d 
        WHERE d."uploaded_by" = users."id" 
          AND d."storage_path" IS NOT NULL 
          AND d."deletion_status" = 'SOFT_DELETED'
    ), 0),
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "users"
ON CONFLICT ("user_id") DO NOTHING;
