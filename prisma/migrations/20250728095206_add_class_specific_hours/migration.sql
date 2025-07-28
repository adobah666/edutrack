-- AlterTable
ALTER TABLE "Class" ADD COLUMN     "customClosingTime" TEXT,
ADD COLUMN     "customOpeningTime" TEXT;

-- CreateTable
CREATE TABLE "ClassScheduleOverride" (
    "id" SERIAL NOT NULL,
    "classId" INTEGER NOT NULL,
    "dayOfWeek" "Day" NOT NULL,
    "openingTime" TEXT NOT NULL,
    "closingTime" TEXT NOT NULL,

    CONSTRAINT "ClassScheduleOverride_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ClassScheduleOverride_classId_dayOfWeek_key" ON "ClassScheduleOverride"("classId", "dayOfWeek");

-- AddForeignKey
ALTER TABLE "ClassScheduleOverride" ADD CONSTRAINT "ClassScheduleOverride_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;
