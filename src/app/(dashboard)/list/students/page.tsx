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

type StudentList = Student & { class: Class; parent?: Parent | null };

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
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      {/* TOP */}
      <div className="flex items-center justify-between">
        <h1 className="hidden md:block text-lg font-semibold">All Students</h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch />
          <div className="flex items-center gap-4 self-end">
            <ClassFilter classes={classes} selectedClassId={classId} />
            <SortButton currentSort={sortOrder} />
            {role === "admin" && (
              <FormContainer table="student" type="create" />
            )}
          </div>
        </div>
      </div>
      {/* LIST */}
      <Table columns={columns} data={tableData} />
      {/* PAGINATION */}
      <Pagination page={p} count={count} />
    </div>
  );
};

export default StudentListPage;