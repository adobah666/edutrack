import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getSchoolFilter } from "@/lib/school-context";
import ParentFeesPageClient from "@/components/ParentFeesPageClient";

const ParentFeesPage = async () => {
  const { userId, sessionClaims } = auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  if (!userId) {
    redirect("/sign-in");
  }

  if (role !== "parent") {
    redirect("/");
  }

  // Get school filter for current user
  const schoolFilter = await getSchoolFilter();

  // Get parent data with children
  const parent = await prisma.parent.findUnique({
    where: { id: userId },
    include: {
      parentStudents: {
        where: schoolFilter.schoolId ? { student: { schoolId: schoolFilter.schoolId } } : {},
        include: {
          student: {
            include: {
              class: {
                select: {
                  name: true
                }
              }
            }
          }
        }
      }
    }
  });

  if (!parent) {
    redirect("/");
  }

  // Get all fees that each student is eligible for (both class-wide and individual)
  const studentIds = parent.parentStudents.map(ps => ps.student.id);
  
  const allEligibleFees = await prisma.classFee.findMany({
    where: {
      ...(schoolFilter.schoolId ? { schoolId: schoolFilter.schoolId } : {}),
      eligibleStudents: {
        some: {
          studentId: { in: studentIds }
        }
      }
    },
    include: {
      feeType: {
        select: {
          id: true,
          name: true,
          isOptional: true
        }
      },
      studentFees: {
        where: {
          studentId: { in: studentIds }
        }
      },
      eligibleStudents: {
        where: {
          studentId: { in: studentIds }
        }
      }
    }
  });

  // Process children's fees
  const childrenWithFees = parent.parentStudents.map(({ student }) => {
    // Get fees that this specific student is eligible for
    const studentEligibleFees = allEligibleFees.filter(fee => 
      fee.eligibleStudents.some(eligible => eligible.studentId === student.id)
    );
    
    // Separate mandatory and optional fees
    const mandatoryFees = studentEligibleFees.filter(fee => !fee.feeType.isOptional);
    
    const feesWithStatus = mandatoryFees.map(classFee => {
      const totalPaid = classFee.studentFees
        .filter(fee => fee.studentId === student.id)
        .reduce((sum, fee) => sum + fee.amount, 0);
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
        payments: classFee.studentFees
          .filter(fee => fee.studentId === student.id)
          .map(fee => ({
            id: fee.id,
            amount: fee.amount,
            paidDate: fee.paidDate
          }))
      };
    });

    return {
      id: student.id,
      name: student.name,
      surname: student.surname,
      className: student.class.name,
      classId: student.classId,
      fees: feesWithStatus
    };
  });



  return (
    <ParentFeesPageClient 
      parent={{
        id: parent.id,
        name: parent.name,
        surname: parent.surname,
        email: parent.email || `${parent.username}@parent.edu`
      }}
      studentChildren={childrenWithFees}
    />
  );
};

export default ParentFeesPage;