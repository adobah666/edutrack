import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getSchoolFilter } from "@/lib/school-context";
import TermResults from "@/components/TermResults";
import StudentTermReport from "@/components/StudentTermReport";

const TermResultsPage = async () => {
  const { userId, sessionClaims } = auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  if (!userId) {
    redirect("/sign-in");
  }

  // Get school filter for current user
  const schoolFilter = await getSchoolFilter();

  // For students, show their comprehensive term report
  if (role === "student") {
    // Get student information
    const student = await prisma.student.findFirst({
      where: {
        id: userId,
        ...(schoolFilter.schoolId ? { schoolId: schoolFilter.schoolId } : {}),
      },
      select: {
        id: true,
        classId: true,
      },
    });

    if (!student) {
      redirect("/");
    }

    return (
      <div className="p-4">
        <StudentTermReport 
          studentId={student.id}
          classId={student.classId}
        />
      </div>
    );
  }

  // For parents, show their children's term reports
  if (role === "parent") {
    // Get parent's children
    const parentStudents = await prisma.parentStudent.findMany({
      where: {
        parentId: userId,
        student: schoolFilter.schoolId ? { schoolId: schoolFilter.schoolId } : undefined,
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            surname: true,
            classId: true,
            class: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    if (parentStudents.length === 0) {
      return (
        <div className="p-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">No Children Found</h2>
              <p className="text-gray-600">You don&apos;t have any children registered in the system.</p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="p-4 space-y-6">
        {parentStudents.map((parentStudent) => (
          <div key={parentStudent.student.id} className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                {parentStudent.student.name} {parentStudent.student.surname}
              </h2>
              <p className="text-gray-600">Class: {parentStudent.student.class.name}</p>
            </div>
            <div className="p-6">
              <StudentTermReport 
                studentId={parentStudent.student.id}
                classId={parentStudent.student.classId}
              />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // For admins and teachers, show the existing subject-specific component
  const [classes, subjects] = await Promise.all([
    prisma.class.findMany({
      where: {
        ...(schoolFilter.schoolId ? { schoolId: schoolFilter.schoolId } : {}),
        ...(role === "teacher" ? {
          lessons: {
            some: {
              teacherId: userId
            }
          }
        } : {})
      },
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: 'asc',
      },
    }),
    prisma.subject.findMany({
      where: {
        ...(schoolFilter.schoolId ? { schoolId: schoolFilter.schoolId } : {}),
        ...(role === "teacher" ? {
          teachers: {
            some: {
              id: userId
            }
          }
        } : {})
      },
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: 'asc',
      },
    }),
  ]);

  return (
    <div className="p-4">
      <TermResults 
        classes={classes}
        subjects={subjects}
      />
    </div>
  );
};

export default TermResultsPage;