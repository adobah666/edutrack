import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getSchoolFilter } from "@/lib/school-context";
import ParentFeesClient from "@/components/ParentFeesClient";
import OptionalFeesManager from "@/components/OptionalFeesManager";

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
                      studentFees: true
                    }
                  }
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

  // Process children's fees
  const childrenWithFees = parent.parentStudents.map(({ student }) => {
    // Separate mandatory and optional fees
    const mandatoryFees = student.class.classFees.filter(classFee => !classFee.feeType.isOptional);
    
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
      fees: feesWithStatus
    };
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Children&apos;s School Fees</h1>
          <p className="text-gray-600">
            View and pay your children&apos;s school fees online using Paystack
          </p>
        </div>

        <ParentFeesClient 
          parent={{
            id: parent.id,
            name: parent.name,
            surname: parent.surname,
            email: parent.email || `${parent.username}@parent.edu`
          }}
          studentChildren={childrenWithFees}
        />

        {/* Optional Fees for each child */}
        <div className="mt-6 space-y-6">
          {childrenWithFees.map((child) => (
            <div key={child.id}>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Optional Fees for {child.name} {child.surname} ({child.className})
              </h2>
              <OptionalFeesManager 
                studentId={child.id}
                currentClassId={parent.parentStudents.find(ps => ps.student.id === child.id)?.student.classId || 0}
                isParentView={true}
                studentName={`${child.name} ${child.surname}`}
                studentEmail={parent.email || `${parent.username}@parent.edu`}
                className={child.className}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ParentFeesPage;