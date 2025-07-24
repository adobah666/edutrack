import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import AccountsTable from "@/components/AccountsTable";
import TableSearch from "@/components/TableSearch";
import prisma from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { getSchoolFilter } from "@/lib/school-context";
import { Prisma } from "@prisma/client";
import Image from "next/image";

type AccountList = {
  id: number;
  code: string;
  name: string;
  type: string;
  subType: string;
  description: string | null;
  isActive: boolean;
  _count: {
    transactions: number;
  };
};



const AccountsPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const schoolFilter = await getSchoolFilter();
  const { page, ...queryParams } = searchParams;
  const p = page ? parseInt(page) : 1;

  // URL PARAMS CONDITION
  const query: Prisma.AccountWhereInput = {};
  
  // Add school filter if schoolId exists
  if (schoolFilter.schoolId) {
    query.schoolId = schoolFilter.schoolId;
  }

  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined) {
        switch (key) {
          case "search":
            query.OR = [
              { name: { contains: value, mode: "insensitive" } },
              { code: { contains: value, mode: "insensitive" } },
              { description: { contains: value, mode: "insensitive" } },
            ];
            break;
          case "type":
            query.type = value.toUpperCase() as any;
            break;
          case "status":
            if (value === "active") {
              query.isActive = true;
            } else if (value === "inactive") {
              query.isActive = false;
            }
            break;
        }
      }
    }
  }

  const [data, count] = await prisma.$transaction([
    prisma.account.findMany({
      where: query,
      include: {
        _count: {
          select: {
            transactions: true,
          },
        },
      },
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
      orderBy: {
        code: "asc",
      },
    }),
    prisma.account.count({ where: query }),
  ]);



  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      {/* TOP */}
      <div className="flex items-center justify-between">
        <h1 className="hidden md:block text-lg font-semibold">Chart of Accounts</h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch />
          <div className="flex items-center gap-4 self-end">
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/filter.png" alt="" width={14} height={14} />
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/sort.png" alt="" width={14} height={14} />
            </button>
            <FormContainer table="account" type="create" />
          </div>
        </div>
      </div>

      {/* INFO CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 my-4">
        {[
          { type: "ASSET", color: "bg-blue-100 text-blue-800", count: data.filter(a => a.type === "ASSET").length },
          { type: "LIABILITY", color: "bg-red-100 text-red-800", count: data.filter(a => a.type === "LIABILITY").length },
          { type: "EQUITY", color: "bg-purple-100 text-purple-800", count: data.filter(a => a.type === "EQUITY").length },
          { type: "INCOME", color: "bg-green-100 text-green-800", count: data.filter(a => a.type === "INCOME").length },
          { type: "EXPENSE", color: "bg-orange-100 text-orange-800", count: data.filter(a => a.type === "EXPENSE").length },
        ].map((item) => (
          <div key={item.type} className="bg-white border rounded-lg p-3 text-center">
            <div className={`text-2xl font-bold ${item.color.split(' ')[1]}`}>{item.count}</div>
            <div className="text-xs text-gray-600">{item.type}</div>
          </div>
        ))}
      </div>

      {/* LIST */}
      <AccountsTable data={data} />
      {/* PAGINATION */}
      <Pagination page={p} count={count} />
    </div>
  );
};

export default AccountsPage;