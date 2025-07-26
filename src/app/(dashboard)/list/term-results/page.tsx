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