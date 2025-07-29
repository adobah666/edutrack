-- CreateEnum
CREATE TYPE "FeeScope" AS ENUM ('CLASS_WIDE', 'INDIVIDUAL');

-- DropForeignKey
ALTER TABLE "ClassFee" DROP CONSTRAINT "ClassFee_classId_fkey";

-- AlterTable
ALTER TABLE "ClassFee" ADD COLUMN     "description" TEXT,
ADD COLUMN     "feeScope" "FeeScope" NOT NULL DEFAULT 'CLASS_WIDE',
ALTER COLUMN "classId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "ClassFee" ADD CONSTRAINT "ClassFee_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE SET NULL ON UPDATE CASCADE;
