import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getSchoolFilter } from "@/lib/school-context";
import StudentFeesClient from "@/components/StudentFeesClient";

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
              feeType: true,
              studentFees: {
                where: { studentId: userId }
              }
            }
          }
        }
      },
      parent: {
        select: {
          id: true,
          email: true,
          name: true,
          surname: true
        }
      }
    }
  });

  if (!student) {
    redirect("/");
  }

  // Calculate fee status for each class fee
  const feesWithStatus = student.class.classFees.map(classFee => {
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My School Fees</h1>
          <p className="text-gray-600">
            View and pay your school fees online using Paystack
          </p>
        </div>

        <StudentFeesClient 
          student={{
            id: student.id,
            name: student.name,
            surname: student.surname,
            className: student.class.name,
            email: student.parent?.email || `${student.username}@school.edu`
          }}
          fees={feesWithStatus}
        />
      </div>
    </div>
  );
};

export default StudentFeesPage;