/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `Grade` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `name` to the `Grade` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Grade" ADD COLUMN     "name" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Grade_name_key" ON "Grade"("name");
