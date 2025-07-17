/*
  Warnings:

  - You are about to drop the column `lessonId` on the `Assignment` table. All the data in the column will be lost.
  - Added the required column `classId` to the `Assignment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `description` to the `Assignment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `subjectId` to the `Assignment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `teacherId` to the `Assignment` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Assignment" DROP CONSTRAINT "Assignment_lessonId_fkey";

-- AlterTable
ALTER TABLE "Assignment" DROP COLUMN "lessonId",
ADD COLUMN     "classId" INTEGER NOT NULL,
ADD COLUMN     "description" TEXT NOT NULL,
ADD COLUMN     "maxPoints" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "subjectId" INTEGER NOT NULL,
ADD COLUMN     "teacherId" TEXT NOT NULL,
ALTER COLUMN "startDate" SET DEFAULT CURRENT_TIMESTAMP;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
