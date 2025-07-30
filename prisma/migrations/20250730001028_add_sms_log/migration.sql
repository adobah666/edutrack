-- CreateEnum
CREATE TYPE "SMSType" AS ENUM ('WELCOME', 'PAYMENT_CONFIRMATION', 'ANNOUNCEMENT', 'EVENT_NOTIFICATION', 'ATTENDANCE_ALERT', 'EXAM_REMINDER', 'MANUAL');

-- CreateEnum
CREATE TYPE "SMSStatus" AS ENUM ('SENT', 'FAILED', 'PENDING');

-- CreateTable
CREATE TABLE "SMSLog" (
    "id" SERIAL NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" "SMSType" NOT NULL DEFAULT 'MANUAL',
    "status" "SMSStatus" NOT NULL DEFAULT 'PENDING',
    "sentBy" TEXT NOT NULL,
    "recipientId" TEXT,
    "messageId" TEXT,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SMSLog_pkey" PRIMARY KEY ("id")
);
