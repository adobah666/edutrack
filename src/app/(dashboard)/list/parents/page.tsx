import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import prisma from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { Parent, Prisma, Student } from "@prisma/client";
import Image from "next/image";
import ParentRow from "@/components/ParentRow";

import { auth } from "@clerk/nextjs/server";

type ParentList = Parent & { students: Student[] };

const ParentListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const { sessionClaims } = auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

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
  const query: Prisma.ParentWhereInput = {};

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
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      {/* TOP */}
      <div className="flex items-center justify-between">
        <h1 className="hidden md:block text-lg font-semibold">All Parents</h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <div className="w-full md:w-auto">
            <TableSearch />
            <p className="text-xs text-gray-500 mt-1">Search by parent or student name</p>
          </div>
          <div className="flex items-center gap-4 self-end">
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/filter.png" alt="" width={14} height={14} />
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/sort.png" alt="" width={14} height={14} />
            </button>
            {role === "admin" && <FormContainer table="parent" type="create" />}
          </div>
        </div>
      </div>
      {/* LIST */}
      <Table 
        columns={columns} 
        data={tableData}
        emptyMessage="No parents found" 
      />
      {/* PAGINATION */}
      <Pagination page={p} count={count} />
    </div>
  );
};

export default ParentListPage;