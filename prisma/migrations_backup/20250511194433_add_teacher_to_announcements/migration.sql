-- AlterTable
ALTER TABLE "Announcement" ADD COLUMN     "teacherId" TEXT;

-- AddForeignKey
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE SET NULL ON UPDATE CASCADE;
