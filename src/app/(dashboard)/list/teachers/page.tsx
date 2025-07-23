import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import SubjectFilter from "@/components/SubjectFilter";
import SortButton from "@/components/SortButton";
import TeacherRow from "@/components/TeacherRow";

import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import Image from "next/image";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { auth } from "@clerk/nextjs/server";
import { getCurrentUserSchool, getSchoolFilter } from "@/lib/school-context";

const TeacherListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const { sessionClaims } = auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  // Get school filter for current user
  const schoolFilter = await getSchoolFilter();

  // Get all subjects for the filter dropdown (filtered by school)
  const subjects = await prisma.subject.findMany({
    where: schoolFilter.schoolId ? { schoolId: schoolFilter.schoolId } : {},
    orderBy: {
      name: 'asc',
    },
    select: {
      id: true,
      name: true,
    },
  });

  const columns = [
    {
      header: "Info",
      accessor: "info",
    },
    {
      header: "Teacher ID",
      accessor: "username",
      className: "hidden md:table-cell",
    },
    {
      header: "Subjects",
      accessor: "subjectNames",
      className: "hidden md:table-cell",
    },
    {
      header: "Classes",
      accessor: "classNames",
      className: "hidden md:table-cell",
    },
    {
      header: "Phone",
      accessor: "phone",
      className: "hidden lg:table-cell",
    },
    {
      header: "Address",
      accessor: "address",
      className: "hidden lg:table-cell",
    },
    ...(role === "admin"
      ? [
        {
          header: "Actions",
          accessor: "actions",
        },
      ]
      : []),
  ];

  const { page, sort, subjectId, ...queryParams } = searchParams;

  const p = page ? parseInt(page) : 1;
  const sortOrder = sort === 'desc' ? 'desc' : 'asc'; // Default to ascending if not specified

  // URL PARAMS CONDITION
  const query: Prisma.TeacherWhereInput = {
    ...(schoolFilter.schoolId ? { schoolId: schoolFilter.schoolId } : {}), // Add school filtering
  };

  // Process standard filter parameters
  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined && key !== 'search') {
        switch (key) {
          case "classId":
            query.lessons = {
              some: {
                classId: parseInt(value),
              },
            };
            break;
          default:
            break;
        }
      }
    }
  }

  // Add subject filter if subjectId is provided
  if (subjectId) {
    query.subjects = {
      some: {
        id: parseInt(subjectId, 10),
      },
    };
  }

  // Enhanced search handling for both teacher name and subject name
  if (queryParams.search) {
    const searchTerm = queryParams.search;

    // Create an OR condition to search in both teacher name and subject names
    query.OR = [
      { name: { contains: searchTerm, mode: "insensitive" } },
      {
        subjects: {
          some: {
            name: { contains: searchTerm, mode: "insensitive" }
          }
        }
      }
    ];
  }

  // Query data with potential ordering by subject name
  let teacherData = await prisma.teacher.findMany({
    where: query,
    include: {
      subjects: true,
      classes: true,
    },
    take: ITEM_PER_PAGE,
    skip: ITEM_PER_PAGE * (p - 1),
  });

  // Count total records that match the query
  const count = await prisma.teacher.count({ where: query });

  // Sort by subject names if needed
  if (sort) {
    teacherData = teacherData.sort((a, b) => {
      const aSubjects = a.subjects.map(s => s.name).sort().join(', ');
      const bSubjects = b.subjects.map(s => s.name).sort().join(', ');

      // Sort based on the direction
      if (sortOrder === 'asc') {
        return aSubjects.localeCompare(bSubjects);
      } else {
        return bSubjects.localeCompare(aSubjects);
      }
    });
  }

  // Transform the data to match the table columns
  const tableData = teacherData.map(item => ({
    id: item.id,
    info: <TeacherRow teacher={item} />,
    username: item.username,
    subjectNames: item.subjects.map(subject => subject.name).join(", "),
    classNames: item.classes.map(classItem => classItem.name).join(", "),
    phone: item.phone,
    address: item.address,
    actions: role === "admin" ? (
      <div className="flex items-center gap-2">
        <FormContainer table="teacher" type="update" data={item} />
        <FormContainer table="teacher" type="delete" id={item.id} />
      </div>
    ) : null
  }));

  return (
    <div className="flex-1 p-4 sm:px-6 lg:px-8">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-lamaPurple to-lamaSky rounded-xl p-6 mb-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-white p-3 rounded-lg shadow-sm">
              <Image
                src="/teacher.png"
                alt="Teachers"
                width={32}
                height={32}
                className="w-8 h-8"
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Teachers</h1>
              <p className="text-gray-600 text-sm">
                Manage and view all teaching staff ({count} total)
              </p>
            </div>
          </div>
          {role === "admin" && (
            <div className="hidden md:block">
              <FormContainer table="teacher" type="create" />
            </div>
          )}
        </div>
      </div>

      {/* Filters and Search Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="flex-1 max-w-md">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Teachers
            </label>
            <TableSearch />
            <p className="text-xs text-gray-500 mt-1">
              Search by teacher name or subject
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Filter:</label>
              <SubjectFilter subjects={subjects} selectedSubjectId={subjectId} />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Sort:</label>
              <SortButton currentSort={sortOrder} />
            </div>
            {role === "admin" && (
              <div className="md:hidden">
                <FormContainer table="teacher" type="create" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-lamaPurpleLight p-2 rounded-lg">
              <Image src="/teacher.png" alt="" width={20} height={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{count}</p>
              <p className="text-sm text-gray-600">Total Teachers</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-lamaSkyLight p-2 rounded-lg">
              <Image src="/subject.png" alt="" width={20} height={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{subjects.length}</p>
              <p className="text-sm text-gray-600">Subjects Taught</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-lamaYellowLight p-2 rounded-lg">
              <Image src="/class.png" alt="" width={20} height={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">
                {teacherData.reduce((acc, teacher) => acc + teacher.classes.length, 0)}
              </p>
              <p className="text-sm text-gray-600">Classes Assigned</p>
            </div>
          </div>
        </div>
      </div>

      {/* Teachers Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">Teachers Directory</h2>
          <p className="text-sm text-gray-600 mt-1">
            {queryParams.search ? `Search results for "${queryParams.search}"` : 'All registered teachers'}
          </p>
        </div>

        <div className="overflow-x-auto">
          <Table
            columns={columns}
            data={tableData}
            emptyMessage="No teachers found"
          />
        </div>
      </div>

      {/* Pagination */}
      <div className="mt-6">
        <Pagination page={p} count={count} />
      </div>
    </div>
  );
};

export default TeacherListPage;