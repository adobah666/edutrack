import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import prisma from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";
import Image from "next/image";
import { auth } from "@clerk/nextjs/server";
import ResultTermFilter from "@/components/ResultTermFilter";
import { getSchoolFilter } from "@/lib/school-context";

type ExtendedResult = {
  id: number;
  score: number;
  examId: number | null;
  assignmentId: number | null;
  studentId: string;
  feedback: string | null;
  student: {
    name: string;
    surname: string;
  };
  exam: {
    id: number;
    title: string;
    startTime: Date;
    endTime: Date;
    term: string;
    subject: {
      name: string;
    } | null;
    class: {
      name: string;
    } | null;
  } | null;
  assignment: {
    id: number;
    title: string;
    startDate: Date;
    dueDate: Date;
    class: {
      name: string;
    } | null;
    teacher: {
      name: string;
      surname: string;
    };
  } | null;
};

const ResultListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const { userId, sessionClaims } = auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  const currentUserId = userId;

  const columns = [
    {
      header: "Title",
      accessor: "title",
    },
    {
      header: "Student",
      accessor: "student",
    },
    {
      header: "Score",
      accessor: "score",
      className: "hidden md:table-cell",
    },
    {
      header: "Teacher",
      accessor: "teacher",
      className: "hidden md:table-cell",
    },
    {
      header: "Class",
      accessor: "class",
      className: "hidden md:table-cell",
    },
    {
      header: "Term",
      accessor: "term",
      className: "hidden md:table-cell",
    },
    {
      header: "Date",
      accessor: "date",
      className: "hidden md:table-cell",
    },
    ...(role === "admin" || role === "teacher"
      ? [
        {
          header: "Actions",
          accessor: "action",
        },
      ]
      : []),
  ];

  const { page, term, ...queryParams } = searchParams;

  const p = page ? parseInt(page) : 1;

  // Get school filter for current user
  const schoolFilter = await getSchoolFilter();

  // URL PARAMS CONDITION
  const query: any = {
    ...schoolFilter, // Add school filtering to results query
  };

  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined) {
        switch (key) {
          case "studentId":
            query.studentId = value;
            break;
          case "search":
            query.OR = [
              { exam: { title: { contains: value, mode: "insensitive" } } },
              { student: { name: { contains: value, mode: "insensitive" } } },
            ];
            break;
          default:
            break;
        }
      }
    }
  }

  // Add term filter
  if (term) {
    query.exam = {
      ...query.exam,
      term
    };
  }

  // ROLE CONDITIONS
  switch (role) {
    case "admin":
      break;
    case "teacher":
      query.OR = [
        { exam: { subject: { teachers: { some: { id: currentUserId! } } } } },
        { assignment: { teacherId: currentUserId! } }
      ];
      break;
    case "student":
      query.studentId = currentUserId!;
      break;
    case "parent":
      query.student = {
        parentId: currentUserId!,
      };
      break;
    default:
      break;
  }

  const [dataRes, count] = await prisma.$transaction([
    prisma.result.findMany({
      where: query,
      include: {
        student: { select: { name: true, surname: true } },
        exam: {
          include: {
            subject: { select: { name: true } },
            class: { select: { name: true } },
          },
        },
        assignment: {
          include: {
            class: { select: { name: true } },
            teacher: { select: { name: true, surname: true } },
          },
        },
      },
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
    }),
    prisma.result.count({ where: query }),
  ]);

  const getTermDisplay = (term: string) => {
    const termMap: Record<string, string> = {
      FIRST: "First Term",
      SECOND: "Second Term",
      THIRD: "Third Term",
      FINAL: "Final Term",
    };
    return termMap[term] || "-";
  };

  const data = dataRes.map((item: ExtendedResult) => {
    const assessment = item.exam || item.assignment;

    if (!assessment) return null;

    // Create a base record for both exam and assignment cases
    const baseRecord = {
      id: item.id,
      title: assessment.title,
      student: `${item.student.name} ${item.student.surname}`,
      score: item.score,
      class: assessment.class?.name || "-",
    };

    // Check if it's an exam (has startTime) or assignment (has startDate and teacher)
    if ('startTime' in assessment) {
      // It's an exam
      return {
        ...baseRecord,
        teacher: "-",
        term: getTermDisplay(assessment.term),
        date: <>{new Intl.DateTimeFormat("en-US").format(assessment.startTime)}</>,
        action: (role === "admin" || role === "teacher") ? (
          <div className="flex items-center gap-2">
            <FormContainer table="result" type="update" data={item} />
            <FormContainer table="result" type="delete" id={item.id} />
          </div>
        ) : null
      };
    } else {
      // It's an assignment
      return {
        ...baseRecord,
        teacher: `${assessment.teacher.name} ${assessment.teacher.surname}`,
        term: "-",
        date: <>{new Intl.DateTimeFormat("en-US").format(assessment.startDate)}</>,
        action: (role === "admin" || role === "teacher") ? (
          <div className="flex items-center gap-2">
            <FormContainer table="result" type="update" data={item} />
            <FormContainer table="result" type="delete" id={item.id} />
          </div>
        ) : null
      };
    }
  }).filter((item: any): item is {
    id: number;
    title: string;
    student: string;
    score: number;
    teacher: string;
    class: string;
    term: string;
    date: JSX.Element;
    action: JSX.Element | null;
  } => item !== null);

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      {/* TOP */}
      <div className="flex items-center justify-between">
        <h1 className="hidden md:block text-lg font-semibold">All Results</h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch />
          <div className="flex items-center gap-4 self-end">
            <ResultTermFilter currentTerm={term} />
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/filter.png" alt="" width={14} height={14} />
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/sort.png" alt="" width={14} height={14} />
            </button>
            {(role === "admin" || role === "teacher") && (
              <FormContainer table="result" type="create" />
            )}
          </div>
        </div>
      </div>
      {/* LIST */}
      <Table columns={columns} data={data} />
      {/* PAGINATION */}
      <Pagination page={p} count={count} />
    </div>
  );
};

export default ResultListPage;