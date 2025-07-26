import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getSchoolFilter } from "@/lib/school-context";
import TermResults from "@/components/TermResults";

const TermResultsPage = async () => {
  const { userId, sessionClaims } = auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  if (!userId) {
    redirect("/sign-in");
  }

  // Get school filter for current user
  const schoolFilter = await getSchoolFilter();

  // Fetch classes and subjects based on user role and school
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
    <TermResults 
      classes={classes}
      subjects={subjects}
    />
  );
};

export default TermResultsPage;