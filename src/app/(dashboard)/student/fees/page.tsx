import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getSchoolFilter } from "@/lib/school-context";
import StudentFeesClient from "@/components/StudentFeesClient";
import OptionalFeesManager from "@/components/OptionalFeesManager";

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

  // Separate mandatory and optional fees
  const mandatoryFees = student.class.classFees.filter(classFee => !classFee.feeType.isOptional);
  const optionalFees = student.class.classFees.filter(classFee => classFee.feeType.isOptional);

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
            email: student.parentStudents[0]?.parent?.email || `${student.username}@school.edu`
          }}
          fees={feesWithStatus}
        />

        <div className="mt-6">
          <OptionalFeesManager 
            studentId={student.id}
            currentClassId={student.classId}
            isParentView={false}
            studentName={`${student.name} ${student.surname}`}
            studentEmail={student.parentStudents[0]?.parent?.email || `${student.username}@school.edu`}
            className={student.class.name}
          />
        </div>
      </div>
    </div>
  );
};

export default StudentFeesPage;