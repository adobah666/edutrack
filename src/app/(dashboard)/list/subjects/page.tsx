import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import SubjectWeightConfig from "@/components/SubjectWeightConfig";
import TermSpecificWeightConfig from "@/components/TermSpecificWeightConfig";
import GradingSchemeManager from "@/components/GradingSchemeManager";
import SubjectGradingSchemeAssignment from "@/components/SubjectGradingSchemeAssignment";
import prisma from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { Prisma, Subject, Teacher } from "@prisma/client";
import Image from "next/image";
import { auth } from "@clerk/nextjs/server";
import { getSchoolFilter } from "@/lib/school-context";

type SubjectList = Subject & { teachers: Teacher[] };

const SubjectListPage = async ({
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
      header: "Subject Name",
      accessor: "name",
    },
    {
      header: "Teachers",
      accessor: "teacherNames",
      className: "hidden md:table-cell",
    },
    ...(role === "admin" ? [
      {
        header: "Actions",
        accessor: "actions",
      }
    ] : []),
  ];

  const { page, ...queryParams } = searchParams;

  const p = page ? parseInt(page) : 1;

  // URL PARAMS CONDITION
  const query: Prisma.SubjectWhereInput = {
    ...(schoolFilter.schoolId ? { schoolId: schoolFilter.schoolId } : {}), // Add school filtering
  };

  // Process standard filter parameters first
  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined && key !== 'search') {
        // Handle any other specific filters here
      }
    }
  }

  // Enhanced search handling for both subject name and teacher name
  if (queryParams.search) {
    const searchTerm = queryParams.search;
    
    // Create an OR condition to search in both subject name and teacher names
    query.OR = [
      { name: { contains: searchTerm, mode: "insensitive" } },
      { 
        teachers: {
          some: {
            name: { contains: searchTerm, mode: "insensitive" }
          }
        }
      }
    ];
  }

  const [data, count] = await prisma.$transaction([
    prisma.subject.findMany({
      where: query,
      include: {
        teachers: true,
      },
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
    }),
    prisma.subject.count({ where: query }),
  ]);

  // Transform the data to match the table columns
  const tableData = data.map(item => ({
    id: item.id,
    name: item.name,
    teacherNames: item.teachers.map(teacher => teacher.name).join(", "),
    actions: role === "admin" ? (
      <div className="flex items-center gap-2">
        <FormContainer table="subject" type="update" data={item} />
        <FormContainer table="subject" type="delete" id={item.id} />
      </div>
    ) : null
  }));

  return (
    <div className="flex flex-col gap-4 m-4 mt-0">
      {/* SUBJECTS LIST */}
      <div className="bg-white p-4 rounded-md flex-1">
        {/* TOP */}
        <div className="flex items-center justify-between">
          <h1 className="hidden md:block text-lg font-semibold">All Subjects</h1>
          <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
            <div className="w-full md:w-auto">
              <TableSearch />
              <p className="text-xs text-gray-500 mt-1">Search by subject or teacher name</p>
            </div>
            <div className="flex items-center gap-4 self-end">
              <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
                <Image src="/filter.png" alt="" width={14} height={14} />
              </button>
              <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
                <Image src="/sort.png" alt="" width={14} height={14} />
              </button>
              {role === "admin" && (
                <FormContainer table="subject" type="create" />
              )}
            </div>
          </div>
        </div>
        {/* LIST */}
        <Table 
          columns={columns} 
          data={tableData}
          emptyMessage="No subjects found" 
        />
        {/* PAGINATION */}
        <Pagination page={p} count={count} />
      </div>

      {/* CONFIGURATION SECTIONS - Only show for admin and teacher */}
      {(role === "admin" || role === "teacher") && data.length > 0 && (
        <>
          <SubjectWeightConfig subjects={data} />
          <TermSpecificWeightConfig subjects={data} />
          <GradingSchemeManager />
          <SubjectGradingSchemeAssignment subjects={data} />
        </>
      )}
    </div>
  );
};

export default SubjectListPage;