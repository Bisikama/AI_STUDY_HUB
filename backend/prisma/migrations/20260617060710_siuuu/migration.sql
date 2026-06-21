/*
  Warnings:

  - A unique constraint covering the columns `[username]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "documents" ADD COLUMN     "rating" DOUBLE PRECISION NOT NULL DEFAULT 0.0;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "phone_number" TEXT,
ADD COLUMN     "username" TEXT;

-- CreateTable
CREATE TABLE "user_document_views" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "document_id" UUID NOT NULL,
    "viewed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_document_views_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_document_views_user_id_viewed_at_idx" ON "user_document_views"("user_id", "viewed_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "user_document_views_user_id_document_id_key" ON "user_document_views"("user_id", "document_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- AddForeignKey
ALTER TABLE "user_document_views" ADD CONSTRAINT "user_document_views_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_document_views" ADD CONSTRAINT "user_document_views_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
