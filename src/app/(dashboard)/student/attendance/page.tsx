import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getSchoolFilter } from "@/lib/school-context";
import StudentAttendanceClient from "@/components/StudentAttendanceClient";

const StudentAttendancePage = async () => {
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

  // Get student data with current class
  const student = await prisma.student.findUnique({
    where: { 
      id: userId,
      ...(schoolFilter.schoolId && { schoolId: schoolFilter.schoolId })
    },
    include: {
      class: {
        select: {
          id: true,
          name: true
        }
      }
    }
  });

  if (!student) {
    redirect("/");
  }

  // Get student's attendance history across all classes
  const attendanceHistory = await prisma.attendance.findMany({
    where: {
      studentId: userId,
      ...(schoolFilter.schoolId && { schoolId: schoolFilter.schoolId })
    },
    include: {
      class: {
        select: {
          id: true,
          name: true
        }
      }
    },
    orderBy: {
      date: 'desc'
    }
  });

  // Get student's class history to show attendance from previous classes
  const classHistory = await prisma.studentClassHistory.findMany({
    where: {
      studentId: userId,
      ...(schoolFilter.schoolId && { 
        student: { 
          schoolId: schoolFilter.schoolId 
        } 
      })
    },
    include: {
      class: {
        select: {
          id: true,
          name: true
        }
      }
    },
    orderBy: {
      startDate: 'desc'
    }
  });

  return (
    <StudentAttendanceClient 
      student={{
        id: student.id,
        name: student.name,
        surname: student.surname,
        currentClass: student.class
      }}
      attendanceHistory={attendanceHistory}
      classHistory={classHistory}
    />
  );
};

export default StudentAttendancePage;