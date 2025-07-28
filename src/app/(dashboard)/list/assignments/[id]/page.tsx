import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getSchoolFilter } from "@/lib/school-context";
import AssignmentDetailClient from "@/components/AssignmentDetailClient";

const AssignmentDetailPage = async ({
  params,
}: {
  params: { id: string };
}) => {
  const { userId, sessionClaims } = auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  if (!userId) {
    redirect("/sign-in");
  }

  const assignmentId = parseInt(params.id);

  // Get school filter for current user
  const schoolFilter = await getSchoolFilter();

  // Fetch assignment with all related data
  const assignment = await prisma.assignment.findUnique({
    where: {
      id: assignmentId,
      ...(schoolFilter.schoolId && { schoolId: schoolFilter.schoolId })
    },
    include: {
      subject: {
        select: {
          id: true,
          name: true
        }
      },
      teacher: {
        select: {
          id: true,
          name: true,
          surname: true,
          email: true
        }
      },
      class: {
        select: {
          id: true,
          name: true,
          students: {
            select: {
              id: true,
              name: true,
              surname: true
            }
          }
        }
      },
      results: {
        include: {
          student: {
            select: {
              id: true,
              name: true,
              surname: true
            }
          }
        }
      }
    }
  });

  if (!assignment) {
    redirect("/list/assignments");
  }

  // Check if user has permission to view this assignment
  let hasAccess = false;
  
  switch (role) {
    case "admin":
      hasAccess = true;
      break;
    case "teacher":
      hasAccess = assignment.teacherId === userId;
      break;
    case "student":
      hasAccess = assignment.class.students.some(student => student.id === userId);
      break;
    case "parent":
      // Check if parent has a child in this class
      const parentStudents = await prisma.parentStudent.findMany({
        where: { parentId: userId },
        select: { studentId: true }
      });
      const studentIds = parentStudents.map(ps => ps.studentId);
      hasAccess = assignment.class.students.some(student => studentIds.includes(student.id));
      break;
    default:
      hasAccess = false;
  }

  if (!hasAccess) {
    redirect("/list/assignments");
  }

  // Get student's result for this assignment (if student or parent)
  let studentResult = null;
  if (role === "student") {
    studentResult = assignment.results.find(result => result.student.id === userId);
  } else if (role === "parent") {
    // For parents, we'll show results for all their children in this class
    const parentStudents = await prisma.parentStudent.findMany({
      where: { parentId: userId },
      select: { studentId: true }
    });
    const studentIds = parentStudents.map(ps => ps.studentId);
    studentResult = assignment.results.filter(result => studentIds.includes(result.student.id));
  }

  return (
    <AssignmentDetailClient 
      assignment={assignment}
      userRole={role}
      currentUserId={userId}
      studentResult={studentResult}
    />
  );
};

export default AssignmentDetailPage;