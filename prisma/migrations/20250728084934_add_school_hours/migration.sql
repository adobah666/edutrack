-- AlterTable
ALTER TABLE "School" ADD COLUMN     "closingTime" TEXT NOT NULL DEFAULT '17:00',
ADD COLUMN     "openingTime" TEXT NOT NULL DEFAULT '08:00';
