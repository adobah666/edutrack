import Announcements from "@/components/Announcements";
import BigCalendarContainer from "@/components/BigCalendarContainer";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { getSchoolFilter } from "@/lib/school-context";
import Link from "next/link";


const ParentPage = async () => {
  const { userId } = auth();
  const currentUserId = userId;

  // Get school filter for current user
  const schoolFilter = await getSchoolFilter();

  const students = await prisma.student.findMany({
    where: {
      parentStudents: {
        some: {
          parentId: currentUserId!,
        },
      },
      ...(schoolFilter.schoolId ? { schoolId: schoolFilter.schoolId } : {}),
    },
  });

  // Calculate total outstanding fees for all children
  let totalOutstandingFees = 0;
  let totalChildren = 0;

  if (students.length > 0) {
    const studentsWithFees = await prisma.student.findMany({
      where: {
        id: { in: students.map(s => s.id) },
        ...(schoolFilter.schoolId ? { schoolId: schoolFilter.schoolId } : {}),
      },
      include: {
        class: {
          include: {
            classFees: {
              where: schoolFilter.schoolId ? { schoolId: schoolFilter.schoolId } : {},
              include: {
                feeType: {
                  select: {
                    isOptional: true
                  }
                },
                studentFees: true,
                eligibleStudents: true
              }
            }
          }
        }
      }
    });

    totalChildren = studentsWithFees.length;

    // Get all fees that the students are eligible for (both class-wide and individual)
    const studentIds = studentsWithFees.map(s => s.id);
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

    // Debug: Log the data
    console.log('=== PARENT HOME PAGE DEBUG ===');
    console.log('Student IDs:', studentIds);
    console.log('All Eligible Fees found:', allEligibleFees.length);
    console.log('All Eligible Fees:', allEligibleFees.map(f => ({
      id: f.id,
      amount: f.amount,
      feeType: f.feeType.name,
      isOptional: f.feeType.isOptional,
      eligibleStudents: f.eligibleStudents.map(e => e.studentId)
    })));

    // Calculate outstanding fees for each student
    studentIds.forEach(studentId => {
      // Get fees that this specific student is eligible for
      const studentEligibleFees = allEligibleFees.filter(fee =>
        fee.eligibleStudents.some(eligible => eligible.studentId === studentId)
      );

      console.log(`Student ${studentId} eligible fees:`, studentEligibleFees.length);

      // Only count mandatory fees
      const mandatoryFees = studentEligibleFees.filter(fee => !fee.feeType.isOptional);

      console.log(`Student ${studentId} mandatory fees:`, mandatoryFees.length);

      mandatoryFees.forEach(fee => {
        const totalPaid = fee.studentFees
          .filter(payment => payment.studentId === studentId)
          .reduce((sum, payment) => sum + payment.amount, 0);
        const remainingAmount = fee.amount - totalPaid;

        console.log(`Fee ${fee.id} (${fee.feeType.name}): Amount=${fee.amount}, Paid=${totalPaid}, Remaining=${remainingAmount}`);

        if (remainingAmount > 0) {
          totalOutstandingFees += remainingAmount;
        }
      });
    });

    console.log('Final total outstanding fees:', totalOutstandingFees);
    console.log('=== END DEBUG ===');
  }

  return (
    <div className="flex-1 p-4 flex gap-4 flex-col xl:flex-row min-h-screen">
      {/* LEFT - Schedule Section */}
      <div className="w-full xl:w-2/3 flex flex-col gap-4">
        {students.map((student) => (
          <div key={student.id} className="bg-white p-4 rounded-md flex-1">
            <h1 className="text-xl font-semibold mb-4">
              Schedule ({student.name + " " + student.surname})
            </h1>
            <div className="h-[500px] md:h-[600px] w-full">
              <BigCalendarContainer type="classId" id={student.classId} compact={true} />
            </div>
          </div>
        ))}

        {/* Show message if no students */}
        {students.length === 0 && (
          <div className="bg-white p-8 rounded-md text-center">
            <h2 className="text-lg font-semibold text-gray-600 mb-2">No Children Found</h2>
            <p className="text-gray-500">No students are associated with your account.</p>
          </div>
        )}
      </div>

      {/* RIGHT - Fees & Announcements Section */}
      <div className="w-full xl:w-1/3 flex flex-col gap-4 max-h-screen overflow-hidden">
        {/* Fees Summary Card */}
        <Link href="/parent/fees" className="block">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 hover:from-blue-600 hover:to-blue-700 cursor-pointer">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold">Outstanding Fees</h3>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div className="text-3xl font-bold mb-1">
              GH₵{totalOutstandingFees.toLocaleString()}
            </div>
            <div className="text-blue-100 text-sm">
              {totalChildren} {totalChildren === 1 ? 'child' : 'children'} • Click to pay
            </div>
          </div>
        </Link>

        {/* Announcements */}
        <div className="flex-1 overflow-y-auto">
          <Announcements />
        </div>
      </div>
    </div>
  );
};

export default ParentPage;
