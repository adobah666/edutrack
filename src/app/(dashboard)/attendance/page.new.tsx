import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { Prisma } from "@prisma/client";
import { ITEM_PER_PAGE } from "@/lib/settings";
import FormContainer from "@/components/FormContainer";
import Table from "@/components/Table";
import Pagination from "@/components/Pagination";
import TableSearch from "@/components/TableSearch";
import Link from "next/link";
import { Suspense } from "react";

async function AttendancePage({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) {
  const { sessionClaims } = auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  const userId = sessionClaims?.sub;

  const page = searchParams?.page || "1";
  const search = searchParams?.search || "";
  const selectedDate = searchParams?.date || new Date().toISOString().split('T')[0];
  const p = parseInt(page);

  // Create a date range for the selected date
  const startDate = new Date(selectedDate);
  startDate.setHours(0, 0, 0, 0);
  
  const endDate = new Date(selectedDate);
  endDate.setHours(23, 59, 59, 999);

  // Base query with date filter
  const query: Prisma.AttendanceWhereInput = {
    date: {
      gte: startDate,
      lte: endDate,
    },
  };

  // Add search conditions if search parameter exists
  if (search) {
    query.OR = [
      { student: { name: { contains: search, mode: "insensitive" } } },
      { student: { surname: { contains: search, mode: "insensitive" } } },
      { class: { name: { contains: search, mode: "insensitive" } } },
    ];
  }

  // Add role-based filters
  if (role === "teacher") {
    query.class = { supervisorId: userId };
  } else if (role === "student") {
    query.studentId = userId;
  } else if (role === "parent") {
    query.student = { parentId: userId };
  }

  // Get total count for pagination
  const count = await prisma.attendance.count({ where: query });

  // Get attendance records
  const attendances = await prisma.attendance.findMany({
    where: query,
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
    take: ITEM_PER_PAGE,
    skip: ITEM_PER_PAGE * (p - 1),
    orderBy: [
      { date: 'desc' },
      { student: { name: 'asc' } }
    ],
  });

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
    status: attendance.present ? (
      <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
        Present
      </span>
    ) : (
      <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">
        Absent
      </span>
    ),
  }));

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Attendance Records</h1>
        {(role === "admin" || role === "teacher") && (
          <Link
            href="/attendance/mark"
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
          >
            Mark Attendance
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

      <Pagination page={p} count={count} />
    </div>
  );
};

export default AttendancePage;
