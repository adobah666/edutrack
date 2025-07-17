-- We need to remove old attendance records since we're changing the structure
DELETE FROM "Attendance";

-- Remove foreign key constraint
ALTER TABLE "Attendance" DROP CONSTRAINT "Attendance_lessonId_fkey";

-- Drop lessonId column
ALTER TABLE "Attendance" DROP COLUMN "lessonId";

-- Add classId column
ALTER TABLE "Attendance" ADD COLUMN "classId" INTEGER NOT NULL;

-- Add foreign key constraint for class
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Add unique constraint to prevent duplicate attendance records for the same student on the same day
ALTER TABLE "Attendance" ADD CONSTRAINT "unique_student_date_attendance" UNIQUE ("studentId", "date", "classId");
