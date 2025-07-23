import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import AttendanceFilters from "@/components/AttendanceFilters";
import prisma from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { Attendance, Prisma, Student, Class } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { getSchoolFilter } from "@/lib/school-context";

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

  // Get school filter for current user
  const schoolFilter = await getSchoolFilter();

  const { classId, page, ...queryParams } = searchParams;
  const p = page ? parseInt(page) : 1;

  // If no class is selected, show class list
  if (!classId) {
    // Fetch classes with attendance statistics
    const classes = await prisma.class.findMany({
      where: schoolFilter,
      include: {
        _count: {
          select: {
            students: true,
            attendances: true,
          },
        },
        attendances: {
          select: {
            date: true,
          },
          distinct: ['date'],
          orderBy: {
            date: 'desc',
          },
          take: 1,
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return (
      <div className="bg-white p-4 sm:px-6 lg:px-8 rounded-md flex-1">
        {/* TOP */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-lg font-semibold">Attendance by Class</h1>
          <div className="flex items-center gap-4">
            {(role === "admin" || role === "teacher") && (
              <FormContainer table="attendance" type="create" />
            )}
          </div>
        </div>

        {/* CLASS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes.map((classItem) => (
            <Link
              key={classItem.id}
              href={`/list/attendance?classId=${classItem.id}`}
              className="block p-6 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg border border-gray-200 hover:shadow-lg transition-shadow duration-200"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-800">
                  {classItem.name}
                </h3>
                <Image src="/class.png" alt="" width={24} height={24} />
              </div>

              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Total Students:</span>
                  <span className="font-medium">{classItem._count.students}</span>
                </div>
                <div className="flex justify-between">
                  <span>Attendance Records:</span>
                  <span className="font-medium">{classItem._count.attendances}</span>
                </div>
                {classItem.attendances.length > 0 && (
                  <div className="flex justify-between">
                    <span>Last Recorded:</span>
                    <span className="font-medium">
                      {new Date(classItem.attendances[0].date).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-4 text-right">
                <span className="text-blue-600 font-medium hover:text-blue-800">
                  View Attendance →
                </span>
              </div>
            </Link>
          ))}
        </div>

        {classes.length === 0 && (
          <div className="text-center py-12">
            <Image src="/class.png" alt="" width={64} height={64} className="mx-auto mb-4 opacity-50" />
            <p className="text-gray-500">No classes found</p>
          </div>
        )}
      </div>
    );
  }

  // If class is selected, show attendance records for that class
  const selectedClassId = parseInt(classId);

  // Get class info
  const selectedClass = await prisma.class.findUnique({
    where: { id: selectedClassId, ...schoolFilter },
    select: { name: true },
  });

  if (!selectedClass) {
    return (
      <div className="bg-white p-4 sm:px-6 lg:px-8 rounded-md flex-1">
        <p className="text-red-500">Class not found</p>
      </div>
    );
  }

  const columns = [
    {
      header: "Student",
      accessor: "student",
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

  // Build query for specific class
  const query: Prisma.AttendanceWhereInput = {
    ...schoolFilter,
    classId: selectedClassId,
  };

  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined) {
        switch (key) {
          case "studentId":
            query.studentId = value;
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
      },
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
      orderBy: [
        { date: 'desc' },
        { student: { name: 'asc' } }
      ],
    }),
    prisma.attendance.count({ where: query }),
  ]);

  const formattedData = attendanceData.map((item: AttendanceRecord) => ({
    id: item.id,
    student: `${item.student.name} ${item.student.surname}`,
    date: new Date(item.date).toLocaleDateString(),
    status: (
      <span
        className={`px-2 py-1 rounded-full text-xs ${item.present
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
    <div className="bg-white p-4 sm:px-6 lg:px-8 rounded-md flex-1">
      {/* TOP */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/list/attendance"
            className="text-blue-600 hover:text-blue-800 flex items-center gap-2"
          >
            ← Back to Classes
          </Link>
          <h1 className="text-lg font-semibold">
            Attendance - {selectedClass.name}
          </h1>
        </div>
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
      <div className="overflow-x-auto">
        <Table columns={columns} data={formattedData} />
      </div>

      {/* PAGINATION */}
      <Pagination page={p} count={count} />
    </div>
  );
};

export default AttendanceListPage;