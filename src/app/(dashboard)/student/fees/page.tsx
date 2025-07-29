import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getSchoolFilter } from "@/lib/school-context";
import StudentFeesPageClient from "@/components/StudentFeesPageClient";

const StudentFeesPage = async () => {
  const { userId, sessionClaims } = auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  if (!userId) {
    redirect("/sign-in");
  }

  if (role !== "student") {
    redirect("/");
  }

  // Get school filter for current user
  const schoolFilter = await getSchoolFilter();

  // Get student data
  const student = await prisma.student.findUnique({
    where: { id: userId },
    include: {
      class: {
        include: {
          classFees: {
            where: schoolFilter.schoolId ? { schoolId: schoolFilter.schoolId } : {},
            include: {
              feeType: {
                select: {
                  id: true,
                  name: true,
                  isOptional: true
                }
              },
              studentFees: {
                where: { studentId: userId }
              },
              eligibleStudents: {
                where: { studentId: userId }
              }
            }
          }
        }
      },
      parentStudents: {
        include: {
          parent: {
            select: {
              id: true,
              email: true,
              name: true,
              surname: true
            }
          }
        }
      }
    }
  });

  if (!student) {
    redirect("/");
  }

  // Filter fees to only include those where the student is eligible
  const eligibleFees = student.class.classFees.filter(classFee => 
    classFee.eligibleStudents.length > 0 // Student is eligible for this fee
  );
  
  // Separate mandatory and optional fees
  const mandatoryFees = eligibleFees.filter(classFee => !classFee.feeType.isOptional);
  const optionalFees = eligibleFees.filter(classFee => classFee.feeType.isOptional);

  // Calculate fee status for mandatory fees only
  const feesWithStatus = mandatoryFees.map(classFee => {
    const totalPaid = classFee.studentFees.reduce((sum, fee) => sum + fee.amount, 0);
    const remainingAmount = classFee.amount - totalPaid;
    const isPaid = remainingAmount <= 0;

    return {
      id: classFee.id,
      feeType: classFee.feeType.name,
      totalAmount: classFee.amount,
      totalPaid,
      remainingAmount: Math.max(0, remainingAmount),
      isPaid,
      dueDate: classFee.dueDate,
      payments: classFee.studentFees.map(fee => ({
        id: fee.id,
        amount: fee.amount,
        paidDate: fee.paidDate
      }))
    };
  });

  return (
    <StudentFeesPageClient 
      student={{
        id: student.id,
        name: student.name,
        surname: student.surname,
        className: student.class.name,
        email: student.parentStudents[0]?.parent?.email || `${student.username}@school.edu`
      }}
      fees={feesWithStatus}
      currentClassId={student.classId}
    />
  );
};

export default StudentFeesPage;