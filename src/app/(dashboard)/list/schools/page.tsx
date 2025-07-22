import FormModal from "@/components/FormModal";
import Pagination from "@/components/Pagination";
import SchoolTable from "@/components/SchoolTable";
import TableSearch from "@/components/TableSearch";
import prisma from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { getCurrentUserSchool } from "@/lib/school-context";
import { School, Prisma } from "@prisma/client";
import Image from "next/image";
import { redirect } from "next/navigation";

type SchoolList = School & {
  _count: {
    students: number;
    teachers: number;
    admins: number;
  };
};

const SchoolListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  // Check if user is super admin
  const userContext = await getCurrentUserSchool();
  if (!userContext.canAccessAllSchools) {
    redirect("/admin");
  }

  const { page, ...queryParams } = searchParams;
  const p = page ? parseInt(page) : 1;

  // URL PARAMS CONDITION
  const query: Prisma.SchoolWhereInput = {};

  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined) {
        switch (key) {
          case "search":
            query.name = { contains: value, mode: "insensitive" };
            break;
        }
      }
    }
  }

  const [data, count] = await prisma.$transaction([
    prisma.school.findMany({
      where: query,
      include: {
        _count: {
          select: {
            students: true,
            teachers: true,
            admins: true,
          },
        },
      },
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
    }),
    prisma.school.count({ where: query }),
  ]);

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      {/* TOP */}
      <div className="flex items-center justify-between">
        <h1 className="hidden md:block text-lg font-semibold">All Schools</h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch />
          <div className="flex items-center gap-4 self-end">
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/filter.png" alt="" width={14} height={14} />
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/sort.png" alt="" width={14} height={14} />
            </button>
            <FormModal table="school" type="create" />
          </div>
        </div>
      </div>
      {/* LIST */}
      <SchoolTable data={data} />
      {/* PAGINATION */}
      <Pagination page={p} count={count} />
    </div>
  );
};

export default SchoolListPage;