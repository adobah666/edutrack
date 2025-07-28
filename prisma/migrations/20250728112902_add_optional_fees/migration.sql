-- AlterTable
ALTER TABLE "FeeType" ADD COLUMN     "isOptional" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "StudentFeeOptIn" (
    "id" SERIAL NOT NULL,
    "studentId" TEXT NOT NULL,
    "feeTypeId" INTEGER NOT NULL,
    "classId" INTEGER NOT NULL,
    "optedInAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "optedInBy" TEXT,
    "schoolId" TEXT NOT NULL,

    CONSTRAINT "StudentFeeOptIn_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StudentFeeOptIn_studentId_feeTypeId_classId_key" ON "StudentFeeOptIn"("studentId", "feeTypeId", "classId");

-- AddForeignKey
ALTER TABLE "StudentFeeOptIn" ADD CONSTRAINT "StudentFeeOptIn_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentFeeOptIn" ADD CONSTRAINT "StudentFeeOptIn_feeTypeId_fkey" FOREIGN KEY ("feeTypeId") REFERENCES "FeeType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentFeeOptIn" ADD CONSTRAINT "StudentFeeOptIn_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentFeeOptIn" ADD CONSTRAINT "StudentFeeOptIn_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
