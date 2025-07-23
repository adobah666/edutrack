import prisma from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { Prisma } from "@prisma/client";
import { auth } from "@clerk/nextjs/server";
import AssignmentList from "@/components/AssignmentList";
import { getSchoolFilter } from "@/lib/school-context";

const AssignmentListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const { userId, sessionClaims } = auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  const currentUserId = userId;

  const { page, ...queryParams } = searchParams;
  const p = page ? parseInt(page) : 1;

  // Get school filter for current user
  const schoolFilter = await getSchoolFilter();

  // Fetch related data for dropdowns (filtered by school)
  const [subjects, classes, teachers] = await Promise.all([
    prisma.subject.findMany({
      where: schoolFilter.schoolId ? { schoolId: schoolFilter.schoolId } : {},
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.class.findMany({
      where: schoolFilter.schoolId ? { schoolId: schoolFilter.schoolId } : {},
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.teacher.findMany({
      where: schoolFilter.schoolId ? { schoolId: schoolFilter.schoolId } : {},
      orderBy: [{ name: "asc" }, { surname: "asc" }],
      select: { id: true, name: true, surname: true },
    }),
  ]);

  const query: Prisma.AssignmentWhereInput = {
    ...(schoolFilter.schoolId ? { schoolId: schoolFilter.schoolId } : {}), // Add school filtering to assignments query
  };

  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined) {
        switch (key) {
          case "classId":
            query.classId = parseInt(value);
            break;
          case "teacherId":
            query.teacherId = value;
            break;
          case "search":
            query.OR = [
              { title: { contains: value, mode: "insensitive" } },
              { subject: { name: { contains: value, mode: "insensitive" } } },
              { teacher: { name: { contains: value, mode: "insensitive" } } },
            ];
            break;
          default:
            break;
        }
      }
    }
  }

  // ROLE CONDITIONS
  switch (role) {
    case "admin":
      break;
    case "teacher":
      query.teacherId = currentUserId!;
      break;
    case "student":
      query.class = {
        students: {
          some: {
            id: currentUserId!,
          },
        },
      };
      break;
    case "parent":
      query.class = {
        students: {
          some: {
            parentId: currentUserId!,
          },
        },
      };
      break;
    default:
      break;
  }

  const [data, count] = await prisma.$transaction([
    prisma.assignment.findMany({
      where: query,
      include: {
        subject: { select: { name: true } },
        teacher: { select: { name: true, surname: true } },
        class: { select: { name: true } },
      },
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
    }),
    prisma.assignment.count({ where: query }),
  ]);

  const relatedData = { subjects, classes, teachers };

  return (
    <AssignmentList
      data={data}
      count={count}
      currentPage={p}
      userRole={role}
      relatedData={relatedData}
    />
  );
};

export default AssignmentListPage;
