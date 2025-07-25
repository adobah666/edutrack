import prisma from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { auth } from "@clerk/nextjs/server";
import { Prisma } from "@prisma/client";
import ExamList from "./ExamList";
import { getSchoolFilter } from "@/lib/school-context";

type Term = "FIRST" | "SECOND" | "THIRD" | "FINAL";

export default async function ExamListPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) {
  const { userId, sessionClaims } = auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  const isAdmin = role === "admin" || role === "teacher";

  const p = searchParams?.page ? parseInt(searchParams.page) : 1;
  const q = searchParams?.q || "";
  const termFilter = searchParams?.term;

  // Get school filter for current user
  const schoolFilter = await getSchoolFilter();

  const query: Prisma.ExamWhereInput = {
    ...(schoolFilter.schoolId ? { schoolId: schoolFilter.schoolId } : {}), // Add school filtering
    ...(q ? {
      OR: [
        { title: { contains: q, mode: 'insensitive' as const } },
        { subject: { name: { contains: q, mode: 'insensitive' as const } } },
        { class: { name: { contains: q, mode: 'insensitive' as const } } },
      ]
    } : {}),
    ...(termFilter && termFilter !== "ALL" && { term: termFilter as Term }),
  };

  const exams = await prisma.exam.findMany({
    where: query,
    include: {
      subject: true,
      class: true,
    },
    take: ITEM_PER_PAGE,
    skip: ITEM_PER_PAGE * (p - 1),
    orderBy: {
      startTime: "desc",
    },
  });

  const count = await prisma.exam.count({ where: query });

  return (
    <ExamList
      exams={exams}
      count={count}
      currentPage={p}
      isAdmin={isAdmin}
      termFilter={termFilter}
    />
  );
}