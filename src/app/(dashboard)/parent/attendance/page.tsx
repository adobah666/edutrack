import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getSchoolFilter } from "@/lib/school-context";
import ParentAttendanceClient from "@/components/ParentAttendanceClient";

const ParentAttendancePage = async () => {
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
          student: {
            include: {
              class: {
                select: {
                  id: true,
                  name: true
                }
              },
              attendances: {
                where: schoolFilter.schoolId ? { schoolId: schoolFilter.schoolId } : {},
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

  // Get class history for each child
  const childrenWithHistory = await Promise.all(
    parent.parentStudents.map(async ({ student }) => {
      const classHistory = await prisma.studentClassHistory.findMany({
        where: {
          studentId: student.id,
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

      return {
        ...student,
        classHistory
      };
    })
  );

  return (
    <ParentAttendanceClient 
      parent={{
        id: parent.id,
        name: parent.name,
        surname: parent.surname
      }}
      children={childrenWithHistory}
    />
  );
};

export default ParentAttendancePage;