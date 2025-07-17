-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- AlterTable
ALTER TABLE "Announcement" ADD COLUMN     "priority" "Priority" NOT NULL DEFAULT 'MEDIUM';
