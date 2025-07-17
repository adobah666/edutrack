import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import ClassFilter from "@/components/ClassFilter";
import SortButton from "@/components/SortButton";

import prisma from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { Class, Parent, Prisma, Student } from "@prisma/client";
import Image from "next/image";
import StudentRow from "@/components/StudentRow";

import { auth } from "@clerk/nextjs/server";

const StudentListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const { sessionClaims } = auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  // Get all available classes for the filter
  const classes = await prisma.class.findMany({
    orderBy: {
      name: 'asc',
    },
    select: {
      id: true,
      name: true,
    },
  }).then(classes => classes.map(c => ({
    id: String(c.id),
    name: c.name
  })));

  const { page, sort, classId, ...queryParams } = searchParams;

  const p = page ? parseInt(page) : 1;
  const sortOrder = sort === 'desc' ? 'desc' : 'asc';

  // URL PARAMS CONDITION
  const query: Prisma.StudentWhereInput = {};

  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined) {
        switch (key) {
          case "teacherId":
            query.class = {
              lessons: {
                some: {
                  teacherId: value,
                },
              },
            };
            break;
          case "search":
            const searchTerms = value.split(' ').filter(term => term.length > 0);
            query.OR = searchTerms.map(term => ({
              OR: [
                { name: { contains: term, mode: "insensitive" } },
                { surname: { contains: term, mode: "insensitive" } }
              ]
            }));
            break;
          default:
            break;
        }
      }
    }
  }

  // Add class filter if classId is provided
  if (classId) {
    query.classId = parseInt(classId, 10);
  }

  const [rawData, count] = await prisma.$transaction([
    prisma.student.findMany({
      where: query,
      include: {
        class: true,
        parent: true,
      },
      orderBy: {
        name: 'asc',
      },
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
    }),
    prisma.student.count({ where: query }),
  ]);

  // Sort the data by relevance if there's a search term
  const sortedData = searchParams.search 
    ? rawData.sort((a, b) => {
        const searchLower = searchParams.search?.toLowerCase() || '';
        const aFullName = `${a.name} ${a.surname}`.toLowerCase();
        const bFullName = `${b.name} ${b.surname}`.toLowerCase();
        
        if (aFullName === searchLower) return -1;
        if (bFullName === searchLower) return 1;
        
        const aIncludes = aFullName.includes(searchLower);
        const bIncludes = bFullName.includes(searchLower);
        if (aIncludes && !bIncludes) return -1;
        if (!aIncludes && bIncludes) return 1;
        
        return aFullName.localeCompare(bFullName);
      })
    : rawData;

  const columns = [
    {
      header: "Info",
      accessor: "info",
    },
    {
      header: "Grade",
      accessor: "grade",
      className: "hidden md:table-cell",
    },
    {
      header: "Class",
      accessor: "class",
      className: "hidden md:table-cell",
    },
    {
      header: "Sex",
      accessor: "sex",
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

  // Transform the data to match the table columns
  const tableData = sortedData.map(item => ({
    id: item.id,
    info: <StudentRow student={item} />,
    grade: item.class.name.charAt(0),
    class: item.class.name,
    sex: item.sex,
    address: item.address || '-',
    actions: role === "admin" ? (
      <div className="flex items-center gap-2">
        <FormContainer table="student" type="update" data={item} />
        <FormContainer table="student" type="delete" id={item.id} />
      </div>
    ) : null
  }));

  return (
    <div className="flex-1 p-4 m-4 mt-0">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-lamaSky to-lamaYellow rounded-xl p-6 mb-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-white p-3 rounded-lg shadow-sm">
              <Image
                src="/student.png"
                alt="Students"
                width={32}
                height={32}
                className="w-8 h-8"
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Students</h1>
              <p className="text-gray-600 text-sm">
                Manage and view all enrolled students ({count} total)
              </p>
            </div>
          </div>
          {role === "admin" && (
            <div className="hidden md:block">
              <FormContainer table="student" type="create" />
            </div>
          )}
        </div>
      </div>

      {/* Filters and Search Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="flex-1 max-w-md">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Students
            </label>
            <TableSearch />
            <p className="text-xs text-gray-500 mt-1">
              Search by student name
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Filter:</label>
              <ClassFilter classes={classes} selectedClassId={classId} />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Sort:</label>
              <SortButton currentSort={sortOrder} />
            </div>
            {role === "admin" && (
              <div className="md:hidden">
                <FormContainer table="student" type="create" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-lamaSkyLight p-2 rounded-lg">
              <Image src="/student.png" alt="" width={20} height={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{count}</p>
              <p className="text-sm text-gray-600">Total Students</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-lamaPurpleLight p-2 rounded-lg">
              <Image src="/class.png" alt="" width={20} height={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{classes.length}</p>
              <p className="text-sm text-gray-600">Active Classes</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-lamaYellowLight p-2 rounded-lg">
              <Image src="/maleFemale.png" alt="" width={20} height={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">
                {sortedData.filter(s => s.sex === 'MALE').length}M / {sortedData.filter(s => s.sex === 'FEMALE').length}F
              </p>
              <p className="text-sm text-gray-600">Gender Ratio</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-lamaSkyLight p-2 rounded-lg">
              <Image src="/parent.png" alt="" width={20} height={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">
                {sortedData.filter(s => s.parent).length}
              </p>
              <p className="text-sm text-gray-600">With Parents</p>
            </div>
          </div>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">Students Directory</h2>
          <p className="text-sm text-gray-600 mt-1">
            {queryParams.search ? `Search results for "${queryParams.search}"` : 'All enrolled students'}
          </p>
        </div>
        
        <Table 
          columns={columns} 
          data={tableData}
          emptyMessage="No students found" 
        />
      </div>

      {/* Pagination */}
      <div className="mt-6">
        <Pagination page={p} count={count} />
      </div>
    </div>
  );
};

export default StudentListPage;