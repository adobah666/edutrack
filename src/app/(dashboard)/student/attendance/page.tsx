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

  // Convert date to string format for AttendanceRecord interface
  const formattedAttendanceHistory = attendanceHistory.map(attendance => ({
    ...attendance,
    date: attendance.date.toISOString().split('T')[0] // Convert to YYYY-MM-DD format
  }));

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

  // Convert dates to string format for ClassHistory interface
  const formattedClassHistory = classHistory.map(history => ({
    ...history,
    startDate: history.startDate.toISOString().split('T')[0],
    endDate: history.endDate ? history.endDate.toISOString().split('T')[0] : null
  }));

  return (
    <StudentAttendanceClient 
      student={{
        id: student.id,
        name: student.name,
        surname: student.surname,
        currentClass: student.class
      }}
      attendanceHistory={formattedAttendanceHistory}
      classHistory={formattedClassHistory}
    />
  );
};

export default StudentAttendancePage;