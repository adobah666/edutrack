-- AlterTable
ALTER TABLE "ClassFee" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "StudentFeeEligibility" (
    "id" SERIAL NOT NULL,
    "studentId" TEXT NOT NULL,
    "classFeeId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudentFeeEligibility_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StudentFeeEligibility_studentId_classFeeId_key" ON "StudentFeeEligibility"("studentId", "classFeeId");

-- AddForeignKey
ALTER TABLE "StudentFeeEligibility" ADD CONSTRAINT "StudentFeeEligibility_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentFeeEligibility" ADD CONSTRAINT "StudentFeeEligibility_classFeeId_fkey" FOREIGN KEY ("classFeeId") REFERENCES "ClassFee"("id") ON DELETE CASCADE ON UPDATE CASCADE;
