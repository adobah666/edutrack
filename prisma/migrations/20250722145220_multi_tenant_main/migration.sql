-- AlterTable
ALTER TABLE "Admin" ALTER COLUMN "name" DROP DEFAULT,
ALTER COLUMN "surname" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Announcement" ALTER COLUMN "schoolId" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Assignment" ALTER COLUMN "schoolId" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Attendance" ALTER COLUMN "schoolId" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Class" ALTER COLUMN "schoolId" DROP DEFAULT;

-- AlterTable
ALTER TABLE "ClassFee" ALTER COLUMN "schoolId" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Event" ALTER COLUMN "schoolId" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Exam" ALTER COLUMN "schoolId" DROP DEFAULT;

-- AlterTable
ALTER TABLE "FeeReminder" ALTER COLUMN "schoolId" DROP DEFAULT;

-- AlterTable
ALTER TABLE "FeeType" ALTER COLUMN "schoolId" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Grade" ALTER COLUMN "schoolId" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Lesson" ALTER COLUMN "schoolId" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Parent" ALTER COLUMN "schoolId" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Result" ALTER COLUMN "schoolId" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Student" ALTER COLUMN "schoolId" DROP DEFAULT;

-- AlterTable
ALTER TABLE "StudentFee" ALTER COLUMN "schoolId" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Subject" ALTER COLUMN "schoolId" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Teacher" ALTER COLUMN "schoolId" DROP DEFAULT;
