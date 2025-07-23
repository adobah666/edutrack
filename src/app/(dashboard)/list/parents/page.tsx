import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import prisma from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { Prisma } from "@prisma/client";
import Image from "next/image";
import ParentRow from "@/components/ParentRow";

import { auth } from "@clerk/nextjs/server";
import { getSchoolFilter } from "@/lib/school-context";

const ParentListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const { sessionClaims } = auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  // Get school filter for current user
  const schoolFilter = await getSchoolFilter();

  const columns = [
    {
      header: "Name",
      accessor: "name",
    },
    {
      header: "Student Names",
      accessor: "studentNames",
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

  const { page, ...queryParams } = searchParams;

  const p = page ? parseInt(page) : 1;

  // Build search query for both parent name and student name
  const query: Prisma.ParentWhereInput = {
    ...(schoolFilter.schoolId ? { schoolId: schoolFilter.schoolId } : {}), // Add school filtering
  };

  if (queryParams.search) {
    const searchTerm = queryParams.search;

    // Create an OR condition to search in both parent name and student names
    query.OR = [
      { name: { contains: searchTerm, mode: "insensitive" } },
      {
        students: {
          some: {
            name: { contains: searchTerm, mode: "insensitive" }
          }
        }
      }
    ];
  } else {
    // Handle other filter params if they exist
    if (queryParams) {
      for (const [key, value] of Object.entries(queryParams)) {
        if (value !== undefined && key !== 'search') {
          // Handle any other specific filters you might have
        }
      }
    }
  }

  const [data, count] = await prisma.$transaction([
    prisma.parent.findMany({
      where: query,
      include: {
        students: true,
      },
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
    }),
    prisma.parent.count({ where: query }),
  ]);

  // Transform the data to match the table columns
  const tableData = data.map(item => ({
    id: item.id,
    name: <ParentRow parent={item} />,
    studentNames: item.students?.map(student => student.name).join(", ") || "-",
    phone: item.phone,
    address: item.address,
    // For the actions column, we'll render it conditionally based on role
    actions: role === "admin" ? (
      <div className="flex items-center gap-2">
        <FormContainer table="parent" type="update" data={item} />
        <FormContainer table="parent" type="delete" id={item.id} />
      </div>
    ) : null
  }));

  return (
    <div className="flex-1 p-4 sm:px-6 lg:px-8">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-lamaYellow to-lamaPurple rounded-xl p-6 mb-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-white p-3 rounded-lg shadow-sm">
              <Image
                src="/parent.png"
                alt="Parents"
                width={32}
                height={32}
                className="w-8 h-8"
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Parents</h1>
              <p className="text-gray-600 text-sm">
                Manage and view all parent guardians ({count} total)
              </p>
            </div>
          </div>
          {role === "admin" && (
            <div className="hidden md:block">
              <FormContainer table="parent" type="create" />
            </div>
          )}
        </div>
      </div>

      {/* Filters and Search Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="flex-1 max-w-md">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Parents
            </label>
            <TableSearch />
            <p className="text-xs text-gray-500 mt-1">
              Search by parent or student name
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow hover:bg-lamaYellowLight transition-colors">
                <Image src="/filter.png" alt="Filter" width={14} height={14} />
              </button>
              <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow hover:bg-lamaYellowLight transition-colors">
                <Image src="/sort.png" alt="Sort" width={14} height={14} />
              </button>
            </div>
            {role === "admin" && (
              <div className="md:hidden">
                <FormContainer table="parent" type="create" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-lamaYellowLight p-2 rounded-lg">
              <Image src="/parent.png" alt="" width={20} height={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{count}</p>
              <p className="text-sm text-gray-600">Total Parents</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-lamaSkyLight p-2 rounded-lg">
              <Image src="/student.png" alt="" width={20} height={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">
                {data.reduce((acc, parent) => acc + (parent.students?.length || 0), 0)}
              </p>
              <p className="text-sm text-gray-600">Children Enrolled</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-lamaPurpleLight p-2 rounded-lg">
              <Image src="/phone.png" alt="" width={20} height={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">
                {data.filter(parent => parent.phone).length}
              </p>
              <p className="text-sm text-gray-600">With Phone</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-lamaYellowLight p-2 rounded-lg">
              <Image src="/mail.png" alt="" width={20} height={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">
                {data.filter(parent => parent.email).length}
              </p>
              <p className="text-sm text-gray-600">With Email</p>
            </div>
          </div>
        </div>
      </div>

      {/* Parents Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">Parents Directory</h2>
          <p className="text-sm text-gray-600 mt-1">
            {queryParams.search ? `Search results for "${queryParams.search}"` : 'All registered parents and guardians'}
          </p>
        </div>

        <div className="overflow-x-auto">
          <Table
            columns={columns}
            data={tableData}
            emptyMessage="No parents found"
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

export default ParentListPage;