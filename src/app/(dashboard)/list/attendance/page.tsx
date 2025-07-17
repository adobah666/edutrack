import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import AttendanceFilters from "@/components/AttendanceFilters";
import prisma from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { Attendance, Prisma, Student, Class } from "@prisma/client";
import Image from "next/image";
import { auth } from "@clerk/nextjs/server";

type AttendanceRecord = Attendance & { 
  student: Pick<Student, 'name' | 'surname'>;
  class: Pick<Class, 'name'>;
};

const AttendanceListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const { sessionClaims } = auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  const columns = [
    {
      header: "Student",
      accessor: "student",
    },
    {
      header: "Class",
      accessor: "class",
    },
    {
      header: "Date",
      accessor: "date",
    },
    {
      header: "Status",
      accessor: "status",
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

  const { page, ...queryParams } = searchParams;
  const p = page ? parseInt(page) : 1;

  // URL PARAMS CONDITION
  const query: Prisma.AttendanceWhereInput = {};

  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined) {
        switch (key) {
          case "studentId":
            query.studentId = value;
            break;
          case "classId":
            query.classId = parseInt(value);
            break;
          case "present":
            query.present = value === "true";
            break;
          case "dateFrom":
            query.date = {
              ...(query.date as Prisma.DateTimeFilter),
              gte: new Date(value),
            };
            break;
          case "dateTo":
            query.date = {
              ...(query.date as Prisma.DateTimeFilter),
              lte: new Date(value),
            };
            break;
          case "search":
            query.OR = [
              {
                student: {
                  name: { contains: value, mode: "insensitive" },
                },
              },
              {
                student: {
                  surname: { contains: value, mode: "insensitive" },
                },
              },              {
                class: {
                  name: { contains: value, mode: "insensitive" },
                },
              },
            ];
            break;
          default:
            break;
        }
      }
    }
  }
  const [attendanceData, count] = await prisma.$transaction([
    prisma.attendance.findMany({
      where: query,
      include: {
        student: {
          select: {
            name: true,
            surname: true,
          }
        },
        class: {
          select: {
            name: true,
          }
        },
      },
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
      orderBy: [
        { date: 'desc' },
        { student: { name: 'asc' } }
      ],
    }),
    prisma.attendance.count({ where: query }),
  ]);  const formattedData = attendanceData.map((item: AttendanceRecord) => ({
    id: item.id,
    student: `${item.student.name} ${item.student.surname}`,
    class: item.class.name,
    date: new Date(item.date).toLocaleDateString(),
    status: (
      <span 
        className={`px-2 py-1 rounded-full text-xs ${
          item.present 
            ? "bg-green-100 text-green-800" 
            : "bg-red-100 text-red-800"
        }`}
      >
        {item.present ? "PRESENT" : "ABSENT"}
      </span>
    ),
    action: (role === "admin" || role === "teacher") ? (
      <div className="flex items-center gap-2">
        <FormContainer table="attendance" type="update" data={item} />
        <FormContainer table="attendance" type="delete" id={item.id} />
      </div>
    ) : null
  }));

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      {/* TOP */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Daily Attendance Records</h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch />
          <div className="flex items-center gap-4 self-end">
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/filter.png" alt="" width={14} height={14} />
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/sort.png" alt="" width={14} height={14} />
            </button>
            {(role === "admin" || role === "teacher") && (
              <FormContainer table="attendance" type="create" />
            )}
          </div>
        </div>
      </div>      
      {/* FILTERS */}
      <AttendanceFilters />
      
      {/* LIST */}
      <Table columns={columns} data={formattedData} />
      
      {/* PAGINATION */}
      <Pagination page={p} count={count} />
    </div>
  );
};

export default AttendanceListPage;