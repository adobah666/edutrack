-- CreateEnum
CREATE TYPE "Term" AS ENUM ('FIRST', 'SECOND', 'THIRD', 'FINAL');

-- AlterTable
ALTER TABLE "Exam" ADD COLUMN     "term" "Term" NOT NULL DEFAULT 'FIRST';
