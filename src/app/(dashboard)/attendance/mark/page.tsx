import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import AttendanceMarker from "@/components/AttendanceMarker";
import { redirect } from "next/navigation";

const MarkAttendancePage = async ({
  searchParams,
}: {
  searchParams: { lessonId?: string };
}) => {
  const { sessionClaims } = auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  
  // Only admin and teachers can mark attendance
  if (role !== "admin" && role !== "teacher") {
    redirect("/");
  }

  const lessonId = searchParams.lessonId ? parseInt(searchParams.lessonId) : null;

  if (!lessonId) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Select a Lesson</h1>
        <p>Please select a lesson from the schedule to mark attendance.</p>
      </div>
    );
  }

  // Get the lesson and its associated class
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: {
      class: {
        include: {
          students: {
            orderBy: {
              name: "asc",
            },
          },
        },
      },
    },
  });

  if (!lesson) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Lesson Not Found</h1>
        <p>The specified lesson could not be found.</p>
      </div>
    );
  }

  // If user is a teacher, verify they are assigned to this lesson
  if (role === "teacher") {
    const teacherId = sessionClaims?.sub;
    if (lesson.teacherId !== teacherId) {
      return (
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p>You are not authorized to mark attendance for this lesson.</p>
        </div>
      );
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Mark Attendance</h1>
        <p className="text-gray-600">
          Lesson: {lesson.name} | Class: {lesson.class.name}
        </p>
      </div>
      <AttendanceMarker
        students={lesson.class.students}
        lessonId={lesson.id}
      />
    </div>
  );
};

export default MarkAttendancePage;
