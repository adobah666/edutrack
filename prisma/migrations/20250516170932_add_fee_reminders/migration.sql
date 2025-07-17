-- CreateEnum
CREATE TYPE "ReminderType" AS ENUM ('UPCOMING', 'OVERDUE');

-- CreateTable
CREATE TABLE "FeeReminder" (
    "id" SERIAL NOT NULL,
    "studentFeeId" INTEGER NOT NULL,
    "type" "ReminderType" NOT NULL,
    "sentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "successful" BOOLEAN NOT NULL DEFAULT true,
    "error" TEXT,

    CONSTRAINT "FeeReminder_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "FeeReminder" ADD CONSTRAINT "FeeReminder_studentFeeId_fkey" FOREIGN KEY ("studentFeeId") REFERENCES "StudentFee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
