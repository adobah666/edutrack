/*
  Warnings:

  - You are about to drop the column `schoolId` on the `Grade` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[level]` on the table `Grade` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name]` on the table `Grade` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "Grade" DROP CONSTRAINT "Grade_schoolId_fkey";

-- DropIndex
DROP INDEX "Grade_level_schoolId_key";

-- DropIndex
DROP INDEX "Grade_name_schoolId_key";

-- AlterTable
ALTER TABLE "Grade" DROP COLUMN "schoolId";

-- CreateIndex
CREATE UNIQUE INDEX "Grade_level_key" ON "Grade"("level");

-- CreateIndex
CREATE UNIQUE INDEX "Grade_name_key" ON "Grade"("name");
