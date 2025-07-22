/*
  Multi-tenant migration: Adding School model and schoolId to all relevant tables
  This migration handles existing data by creating a default school first.
*/

-- CreateEnum
CREATE TYPE "AdminRole" AS ENUM ('SUPER_ADMIN', 'SCHOOL_ADMIN');

-- DropIndex
DROP INDEX "Class_name_key";

-- DropIndex
DROP INDEX "FeeType_name_key";

-- DropIndex
DROP INDEX "Grade_level_key";

-- DropIndex
DROP INDEX "Grade_name_key";

-- DropIndex
DROP INDEX "Subject_name_key";

-- CreateTable
CREATE TABLE "School" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "logo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "School_pkey" PRIMARY KEY ("id")
);

-- Insert default school for existing data
INSERT INTO "School" ("id", "name", "address", "phone", "email", "createdAt", "updatedAt") 
VALUES ('default-school-id', 'Default School', 'Default Address', NULL, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Add columns to Admin table first (with defaults for existing data)
ALTER TABLE "Admin" ADD COLUMN "email" TEXT;
ALTER TABLE "Admin" ADD COLUMN "name" TEXT DEFAULT 'Admin';
ALTER TABLE "Admin" ADD COLUMN "surname" TEXT DEFAULT 'User';
ALTER TABLE "Admin" ADD COLUMN "role" "AdminRole" NOT NULL DEFAULT 'SCHOOL_ADMIN';
ALTER TABLE "Admin" ADD COLUMN "schoolId" TEXT;

-- Update existing Admin records
UPDATE "Admin" SET "name" = 'Admin', "surname" = 'User', "schoolId" = 'default-school-id' WHERE "name" IS NULL;

-- Make name and surname NOT NULL after setting defaults
ALTER TABLE "Admin" ALTER COLUMN "name" SET NOT NULL;
ALTER TABLE "Admin" ALTER COLUMN "surname" SET NOT NULL;

-- Add schoolId columns to all tables with default value
ALTER TABLE "Student" ADD COLUMN "schoolId" TEXT DEFAULT 'default-school-id';
ALTER TABLE "Teacher" ADD COLUMN "schoolId" TEXT DEFAULT 'default-school-id';
ALTER TABLE "Parent" ADD COLUMN "schoolId" TEXT DEFAULT 'default-school-id';
ALTER TABLE "Grade" ADD COLUMN "schoolId" TEXT DEFAULT 'default-school-id';
ALTER TABLE "Class" ADD COLUMN "schoolId" TEXT DEFAULT 'default-school-id';
ALTER TABLE "Subject" ADD COLUMN "schoolId" TEXT DEFAULT 'default-school-id';
ALTER TABLE "Lesson" ADD COLUMN "schoolId" TEXT DEFAULT 'default-school-id';
ALTER TABLE "Exam" ADD COLUMN "schoolId" TEXT DEFAULT 'default-school-id';
ALTER TABLE "Assignment" ADD COLUMN "schoolId" TEXT DEFAULT 'default-school-id';
ALTER TABLE "Result" ADD COLUMN "schoolId" TEXT DEFAULT 'default-school-id';
ALTER TABLE "Attendance" ADD COLUMN "schoolId" TEXT DEFAULT 'default-school-id';
ALTER TABLE "Event" ADD COLUMN "schoolId" TEXT DEFAULT 'default-school-id';
ALTER TABLE "Announcement" ADD COLUMN "schoolId" TEXT DEFAULT 'default-school-id';
ALTER TABLE "FeeType" ADD COLUMN "schoolId" TEXT DEFAULT 'default-school-id';
ALTER TABLE "ClassFee" ADD COLUMN "schoolId" TEXT DEFAULT 'default-school-id';
ALTER TABLE "StudentFee" ADD COLUMN "schoolId" TEXT DEFAULT 'default-school-id';
ALTER TABLE "FeeReminder" ADD COLUMN "schoolId" TEXT DEFAULT 'default-school-id';

-- Update all existing records to use the default school
UPDATE "Student" SET "schoolId" = 'default-school-id' WHERE "schoolId" IS NULL;
UPDATE "Teacher" SET "schoolId" = 'default-school-id' WHERE "schoolId" IS NULL;
UPDATE "Parent" SET "schoolId" = 'default-school-id' WHERE "schoolId" IS NULL;
UPDATE "Grade" SET "schoolId" = 'default-school-id' WHERE "schoolId" IS NULL;
UPDATE "Class" SET "schoolId" = 'default-school-id' WHERE "schoolId" IS NULL;
UPDATE "Subject" SET "schoolId" = 'default-school-id' WHERE "schoolId" IS NULL;
UPDATE "Lesson" SET "schoolId" = 'default-school-id' WHERE "schoolId" IS NULL;
UPDATE "Exam" SET "schoolId" = 'default-school-id' WHERE "schoolId" IS NULL;
UPDATE "Assignment" SET "schoolId" = 'default-school-id' WHERE "schoolId" IS NULL;
UPDATE "Result" SET "schoolId" = 'default-school-id' WHERE "schoolId" IS NULL;
UPDATE "Attendance" SET "schoolId" = 'default-school-id' WHERE "schoolId" IS NULL;
UPDATE "Event" SET "schoolId" = 'default-school-id' WHERE "schoolId" IS NULL;
UPDATE "Announcement" SET "schoolId" = 'default-school-id' WHERE "schoolId" IS NULL;
UPDATE "FeeType" SET "schoolId" = 'default-school-id' WHERE "schoolId" IS NULL;
UPDATE "ClassFee" SET "schoolId" = 'default-school-id' WHERE "schoolId" IS NULL;
UPDATE "StudentFee" SET "schoolId" = 'default-school-id' WHERE "schoolId" IS NULL;
UPDATE "FeeReminder" SET "schoolId" = 'default-school-id' WHERE "schoolId" IS NULL;

-- Remove default values and make columns NOT NULL
ALTER TABLE "Student" ALTER COLUMN "schoolId" SET NOT NULL;
ALTER TABLE "Teacher" ALTER COLUMN "schoolId" SET NOT NULL;
ALTER TABLE "Parent" ALTER COLUMN "schoolId" SET NOT NULL;
ALTER TABLE "Grade" ALTER COLUMN "schoolId" SET NOT NULL;
ALTER TABLE "Class" ALTER COLUMN "schoolId" SET NOT NULL;
ALTER TABLE "Subject" ALTER COLUMN "schoolId" SET NOT NULL;
ALTER TABLE "Lesson" ALTER COLUMN "schoolId" SET NOT NULL;
ALTER TABLE "Exam" ALTER COLUMN "schoolId" SET NOT NULL;
ALTER TABLE "Assignment" ALTER COLUMN "schoolId" SET NOT NULL;
ALTER TABLE "Result" ALTER COLUMN "schoolId" SET NOT NULL;
ALTER TABLE "Attendance" ALTER COLUMN "schoolId" SET NOT NULL;
ALTER TABLE "Event" ALTER COLUMN "schoolId" SET NOT NULL;
ALTER TABLE "Announcement" ALTER COLUMN "schoolId" SET NOT NULL;
ALTER TABLE "FeeType" ALTER COLUMN "schoolId" SET NOT NULL;
ALTER TABLE "ClassFee" ALTER COLUMN "schoolId" SET NOT NULL;
ALTER TABLE "StudentFee" ALTER COLUMN "schoolId" SET NOT NULL;
ALTER TABLE "FeeReminder" ALTER COLUMN "schoolId" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Admin_email_key" ON "Admin"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Class_name_schoolId_key" ON "Class"("name", "schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "FeeType_name_schoolId_key" ON "FeeType"("name", "schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "Grade_level_schoolId_key" ON "Grade"("level", "schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "Grade_name_schoolId_key" ON "Grade"("name", "schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "Subject_name_schoolId_key" ON "Subject"("name", "schoolId");

-- AddForeignKey
ALTER TABLE "Admin" ADD CONSTRAINT "Admin_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Teacher" ADD CONSTRAINT "Teacher_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Parent" ADD CONSTRAINT "Parent_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Grade" ADD CONSTRAINT "Grade_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Class" ADD CONSTRAINT "Class_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subject" ADD CONSTRAINT "Subject_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exam" ADD CONSTRAINT "Exam_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Result" ADD CONSTRAINT "Result_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeType" ADD CONSTRAINT "FeeType_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassFee" ADD CONSTRAINT "ClassFee_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentFee" ADD CONSTRAINT "StudentFee_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeReminder" ADD CONSTRAINT "FeeReminder_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
