import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import AttendanceFilters from "@/components/AttendanceFilters";
import DateSelector from "@/components/DateSelector";
import prisma from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { Attendance, Prisma, Student, Class } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { getSchoolFilter } from "@/lib/school-context";

type AttendanceRecord = Attendance & {
  student: Pick<Student, 'name' | 'surname'>;
};

type ClassWithCounts = Class & {
  _count: {
    students: number;
    attendances: number;
  };
  attendances: {
    date: Date;
  }[];
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

  const { classId, page, selectedDate, ...queryParams } = searchParams;
  const p = page ? parseInt(page) : 1;

  // Use selected date or default to today
  const dateToCheck = selectedDate ? new Date(selectedDate) : new Date();
  dateToCheck.setHours(0, 0, 0, 0); // Reset time to start of day

  // If no class is selected, show class list
  if (!classId) {
    // Fetch classes with attendance statistics
    const classes: ClassWithCounts[] = await prisma.class.findMany({
      where: schoolFilter.schoolId ? { schoolId: schoolFilter.schoolId } : {},
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

    // Get attendance summary for the selected date
    const [totalStudents, attendanceForDate] = await prisma.$transaction([
      // Total enrolled students across all classes
      prisma.student.count({
        where: schoolFilter.schoolId ? { schoolId: schoolFilter.schoolId } : {},
      }),
      // Attendance records for the selected date
      prisma.attendance.findMany({
        where: {
          ...(schoolFilter.schoolId ? { schoolId: schoolFilter.schoolId } : {}),
          date: {
            gte: dateToCheck,
            lt: new Date(dateToCheck.getTime() + 24 * 60 * 60 * 1000), // Next day
          },
        },
        include: {
          class: {
            select: { name: true },
          },
        },
      }),
    ]);

    const presentCount = attendanceForDate.filter(record => record.present).length;
    const absentCount = attendanceForDate.filter(record => !record.present).length;
    const totalRecorded = attendanceForDate.length;

    // Group attendance by class for the selected date
    const attendanceByClass = attendanceForDate.reduce((acc, record) => {
      const className = record.class.name;
      if (!acc[className]) {
        acc[className] = { present: 0, absent: 0, total: 0 };
      }
      if (record.present) {
        acc[className].present++;
      } else {
        acc[className].absent++;
      }
      acc[className].total++;
      return acc;
    }, {} as Record<string, { present: number; absent: number; total: number }>);

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

        {/* DATE SELECTOR AND SUMMARY */}
        <div className="mb-6 space-y-4">
          {/* Date Selector */}
          <DateSelector selectedDate={selectedDate} />

          {/* Attendance Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 font-medium">Total Enrolled</p>
                  <p className="text-2xl font-bold text-blue-800">{totalStudents}</p>
                </div>
                <Image src="/student.png" alt="" width={32} height={32} className="opacity-60" />
              </div>
            </div>

            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600 font-medium">Present</p>
                  <p className="text-2xl font-bold text-green-800">{presentCount}</p>
                </div>
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 text-lg">✓</span>
                </div>
              </div>
            </div>

            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-600 font-medium">Absent</p>
                  <p className="text-2xl font-bold text-red-800">{absentCount}</p>
                </div>
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <span className="text-red-600 text-lg">✗</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Attendance Rate</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {totalRecorded > 0 ? Math.round((presentCount / totalRecorded) * 100) : 0}%
                  </p>
                </div>
                <Image src="/attendance.png" alt="" width={32} height={32} className="opacity-60" />
              </div>
            </div>
          </div>

          {/* Date Summary */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              Attendance Summary for {dateToCheck.toLocaleDateString()}
            </h3>
            {totalRecorded > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(attendanceByClass).map(([className, stats]) => (
                  <div key={className} className="bg-white p-3 rounded border">
                    <h4 className="font-medium text-gray-800 mb-2">{className}</h4>
                    <div className="flex justify-between text-sm">
                      <span className="text-green-600">Present: {stats.present}</span>
                      <span className="text-red-600">Absent: {stats.absent}</span>
                      <span className="text-gray-600">Total: {stats.total}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No attendance records found for this date.</p>
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
    where: {
      id: selectedClassId,
      ...(schoolFilter.schoolId ? { schoolId: schoolFilter.schoolId } : {})
    },
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
    ...(schoolFilter.schoolId ? { schoolId: schoolFilter.schoolId } : {}),
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

  const formattedData = attendanceData.map((item) => ({
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