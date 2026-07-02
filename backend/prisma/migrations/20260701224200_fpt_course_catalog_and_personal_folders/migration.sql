-- CreateTable
CREATE TABLE "majors" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "majors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "major_subjects" (
    "major_id" UUID NOT NULL,
    "subject_id" INTEGER NOT NULL,

    CONSTRAINT "major_subjects_pkey" PRIMARY KEY ("major_id","subject_id")
);

-- CreateTable
CREATE TABLE "personal_folders" (
    "id" UUID NOT NULL,
    "owner_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "parent_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "personal_folders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "majors_code_key" ON "majors"("code");

-- AlterTable
ALTER TABLE "subjects" ADD COLUMN "is_active" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "documents" ADD COLUMN "personal_folder_id" UUID;

-- AddForeignKey
ALTER TABLE "major_subjects" ADD CONSTRAINT "major_subjects_major_id_fkey" FOREIGN KEY ("major_id") REFERENCES "majors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "major_subjects" ADD CONSTRAINT "major_subjects_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personal_folders" ADD CONSTRAINT "personal_folders_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personal_folders" ADD CONSTRAINT "personal_folders_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "personal_folders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_personal_folder_id_fkey" FOREIGN KEY ("personal_folder_id") REFERENCES "personal_folders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
