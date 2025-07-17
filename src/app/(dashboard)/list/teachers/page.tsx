import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import SubjectFilter from "@/components/SubjectFilter";
import SortButton from "@/components/SortButton";
import TeacherRow from "@/components/TeacherRow";

import prisma from "@/lib/prisma";
import { Class, Prisma, Subject, Teacher } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { auth } from "@clerk/nextjs/server";

type TeacherList = Teacher & { subjects: Subject[] } & { classes: Class[] };

const TeacherListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const { sessionClaims } = auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  
  // Get all subjects for the filter dropdown
  const subjects = await prisma.subject.findMany({
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
  const query: Prisma.TeacherWhereInput = {};

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
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      {/* TOP */}
      <div className="flex items-center justify-between">
        <h1 className="hidden md:block text-lg font-semibold">All Teachers</h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <div className="w-full md:w-auto">
            <TableSearch />
            <p className="text-xs text-gray-500 mt-1">Search by teacher or subject name</p>
          </div>
          <div className="flex items-center gap-4 self-end">
            <SubjectFilter subjects={subjects} selectedSubjectId={subjectId} />
            <SortButton currentSort={sortOrder} />
            {role === "admin" && (
              <FormContainer table="teacher" type="create" />
            )}
          </div>
        </div>
      </div>
      {/* LIST */}
      <Table 
        columns={columns} 
        data={tableData}
        emptyMessage="No teachers found" 
      />
      {/* PAGINATION */}
      <Pagination page={p} count={count} />
    </div>
  );
};

export default TeacherListPage;