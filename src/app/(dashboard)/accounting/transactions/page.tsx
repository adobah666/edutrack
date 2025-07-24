import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import TransactionsTable from "@/components/TransactionsTable";
import TableSearch from "@/components/TableSearch";
import prisma from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { getSchoolFilter } from "@/lib/school-context";
import { Prisma } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";

type TransactionList = {
  id: number;
  reference: string;
  description: string;
  amount: number;
  type: string;
  paymentMethod: string;
  date: Date;
  receiptNumber: string | null;
  mainAccount: {
    name: string;
    code: string;
    type: string;
  };
};



const TransactionsPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const schoolFilter = await getSchoolFilter();
  const { page, ...queryParams } = searchParams;
  const p = page ? parseInt(page) : 1;

  // URL PARAMS CONDITION
  const query: Prisma.TransactionWhereInput = {};
  
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
              { description: { contains: value, mode: "insensitive" } },
              { reference: { contains: value, mode: "insensitive" } },
              { receiptNumber: { contains: value, mode: "insensitive" } },
            ];
            break;
          case "type":
            query.type = value.toUpperCase() as any;
            break;
          case "account":
            query.mainAccount = {
              name: { contains: value, mode: "insensitive" }
            };
            break;
        }
      }
    }
  }

  const [data, count, totalIncome, totalExpenses] = await prisma.$transaction([
    prisma.transaction.findMany({
      where: query,
      include: {
        mainAccount: {
          select: {
            name: true,
            code: true,
            type: true,
          },
        },
      },
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
      orderBy: {
        date: "desc",
      },
    }),
    prisma.transaction.count({ where: query }),
    prisma.transaction.aggregate({
      where: {
        ...query,
        type: "INCOME",
      },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: {
        ...query,
        type: "EXPENSE",
      },
      _sum: { amount: true },
    }),
  ]);

  const income = totalIncome._sum.amount || 0;
  const expenses = totalExpenses._sum.amount || 0;
  const netIncome = income - expenses;



  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      {/* TOP */}
      <div className="flex items-center justify-between">
        <h1 className="hidden md:block text-lg font-semibold">Transactions</h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch />
          <div className="flex items-center gap-4 self-end">
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/filter.png" alt="" width={14} height={14} />
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/sort.png" alt="" width={14} height={14} />
            </button>
            <Link href="/accounting/transactions/create">
              <button className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 flex items-center gap-2">
                <Image src="/create.png" alt="" width={16} height={16} />
                New Transaction
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600">Total Income</p>
              <p className="text-2xl font-bold text-green-800">GHS {income.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <Image src="/finance.png" alt="" width={24} height={24} />
            </div>
          </div>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-600">Total Expenses</p>
              <p className="text-2xl font-bold text-red-800">GHS {expenses.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <Image src="/finance.png" alt="" width={24} height={24} />
            </div>
          </div>
        </div>

        <div className={`${netIncome >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-red-50 border-red-200'} border rounded-lg p-4`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${netIncome >= 0 ? 'text-blue-600' : 'text-red-600'}`}>Net Income</p>
              <p className={`text-2xl font-bold ${netIncome >= 0 ? 'text-blue-800' : 'text-red-800'}`}>
                GHS {netIncome.toLocaleString()}
              </p>
            </div>
            <div className={`w-12 h-12 ${netIncome >= 0 ? 'bg-blue-100' : 'bg-red-100'} rounded-full flex items-center justify-center`}>
              <Image src="/result.png" alt="" width={24} height={24} />
            </div>
          </div>
        </div>
      </div>

      {/* LIST */}
      <TransactionsTable data={data} />
      {/* PAGINATION */}
      <Pagination page={p} count={count} />
    </div>
  );
};

export default TransactionsPage;