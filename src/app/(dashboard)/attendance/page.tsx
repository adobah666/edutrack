import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { Prisma } from "@prisma/client";
import { ITEM_PER_PAGE } from "@/lib/settings";
import Table from "@/components/Table";
import Pagination from "@/components/Pagination";
import TableSearch from "@/components/TableSearch";
import Link from "next/link";

const AttendancePage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const { sessionClaims } = auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  const userId = sessionClaims?.sub;

  const page = searchParams?.page || "1";
  const search = searchParams?.search || "";
  const selectedDate = searchParams?.date || new Date().toISOString().split('T')[0];
  const p = parseInt(page);

  // Create base query
  let baseQuery: Prisma.AttendanceWhereInput = {};

  // Add date filter
  const startDate = new Date(selectedDate);
  startDate.setHours(0, 0, 0, 0);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 1);

  baseQuery.date = {
    gte: startDate,
    lt: endDate
  };

  // Add search if provided
  if (search) {
    baseQuery.OR = [
      { student: { name: { contains: search, mode: "insensitive" } } },
      { student: { surname: { contains: search, mode: "insensitive" } } },
      { class: { name: { contains: search, mode: "insensitive" } } },
    ];
  }

  // Add role-based filters
  if (role === "teacher") {
    baseQuery.class = { supervisorId: userId };
  } else if (role === "student") {
    baseQuery.studentId = userId;
  } else if (role === "parent") {
    baseQuery.student = { parentId: userId };
  }

  console.log('Fetching attendance with query:', JSON.stringify(baseQuery, null, 2));

  // Get data with pagination
  const [attendances, totalCount] = await prisma.$transaction([
    prisma.attendance.findMany({
      where: baseQuery,
      include: {
        student: {
          select: {
            name: true,
            surname: true,
          },
        },
        class: {
          select: {
            name: true,
          },
        },
      },
      orderBy: [
        { date: "desc" },
        { student: { name: "asc" } },
      ],
      skip: (p - 1) * ITEM_PER_PAGE,
      take: ITEM_PER_PAGE,
    }),
    prisma.attendance.count({ where: baseQuery }),
  ]);

  console.log('Found attendance records:', attendances.length);

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
  ];

  const formattedData = attendances.map((attendance) => ({
    id: attendance.id,
    student: `${attendance.student.name} ${attendance.student.surname}`,
    class: attendance.class.name,
    date: new Date(attendance.date).toLocaleDateString(),
    status: (
      <span
        className={`px-2 py-1 rounded-full text-xs ${
          attendance.present
            ? "bg-green-100 text-green-800"
            : "bg-red-100 text-red-800"
        }`}
      >
        {attendance.present ? "Present" : "Absent"}
      </span>
    ),
  }));

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Attendance Records</h1>
        {(role === "admin" || role === "teacher") && (
          <Link
            href="/list/attendance"
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
          >
            Manage Attendance
          </Link>
        )}
      </div>
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <TableSearch placeholder="Search students or classes..." />
        </div>
        <div>
          <input
            type="date"
            defaultValue={selectedDate}
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm"
            onChange={(e) => {
              const url = new URL(window.location.href);
              url.searchParams.set('date', e.target.value);
              window.location.href = url.toString();
            }}
          />
        </div>
      </div>

      {formattedData.length > 0 ? (
        <Table data={formattedData} columns={columns} />
      ) : (
        <div className="text-center py-10">
          <p className="text-gray-500">No attendance records found for {new Date(selectedDate).toLocaleDateString()}</p>
        </div>
      )}

      <Pagination page={p} count={totalCount} />
    </div>
  );
};

export default AttendancePage;