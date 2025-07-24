import prisma from "@/lib/prisma";
import { getSchoolFilter } from "@/lib/school-context";
import Image from "next/image";
import Link from "next/link";
import IncomeStatementPrint from "@/components/IncomeStatementPrint";

const IncomeStatementPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const schoolFilter = await getSchoolFilter();
  const { startDate, endDate } = searchParams;
  
  // Default to current year if no dates provided
  const currentYear = new Date().getFullYear();
  const defaultStartDate = startDate || `${currentYear}-01-01`;
  const defaultEndDate = endDate || `${currentYear}-12-31`;

  // Get school information
  const school = await prisma.school.findFirst({
    where: schoolFilter.schoolId ? { id: schoolFilter.schoolId } : {},
    select: { name: true, address: true, phone: true },
  });

  // Get income accounts with transactions
  const incomeAccounts = await prisma.account.findMany({
    where: {
      ...(schoolFilter.schoolId ? { schoolId: schoolFilter.schoolId } : {}),
      type: "INCOME",
      isActive: true,
    },
    include: {
      transactions: {
        where: {
          type: "INCOME",
          date: {
            gte: new Date(defaultStartDate),
            lte: new Date(defaultEndDate),
          },
        },
        select: { amount: true },
      },
    },
    orderBy: { code: "asc" },
  });

  // Get expense accounts with transactions
  const expenseAccounts = await prisma.account.findMany({
    where: {
      ...(schoolFilter.schoolId ? { schoolId: schoolFilter.schoolId } : {}),
      type: "EXPENSE",
      isActive: true,
    },
    include: {
      transactions: {
        where: {
          type: "EXPENSE",
          date: {
            gte: new Date(defaultStartDate),
            lte: new Date(defaultEndDate),
          },
        },
        select: { amount: true },
      },
    },
    orderBy: { code: "asc" },
  });

  // Calculate totals
  const incomeAccountTotals = incomeAccounts.map(account => ({
    ...account,
    total: account.transactions.reduce((sum, t) => sum + t.amount, 0),
  }));

  const expenseAccountTotals = expenseAccounts.map(account => ({
    ...account,
    total: account.transactions.reduce((sum, t) => sum + t.amount, 0),
  }));

  const totalIncome = incomeAccountTotals.reduce((sum, acc) => sum + acc.total, 0);
  const totalExpenses = expenseAccountTotals.reduce((sum, acc) => sum + acc.total, 0);
  const netIncome = totalIncome - totalExpenses;

  return (
    <div className="p-4 max-w-4xl mx-auto">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <Link href="/accounting/reports" className="text-blue-600 hover:text-blue-800 flex items-center gap-2">
          <span>←</span>
          Back to Reports
        </Link>
        <IncomeStatementPrint 
          reportData={{
            school: school || { name: "School Name", address: "", phone: "" },
            incomeAccountTotals,
            expenseAccountTotals,
            totalIncome,
            totalExpenses,
            netIncome,
            startDate: defaultStartDate,
            endDate: defaultEndDate
          }}
        />
      </div>

      {/* REPORT CONTENT */}
      <div className="bg-white p-8 rounded-lg shadow-sm border print:shadow-none print:border-none">
        {/* REPORT HEADER */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">{school?.name || "School Name"}</h1>
          <p className="text-gray-600">{school?.address}</p>
          <p className="text-gray-600">{school?.phone}</p>
          <h2 className="text-xl font-semibold mt-4 text-gray-800">Income Statement</h2>
          <p className="text-gray-600">
            For the period from {new Intl.DateTimeFormat("en-GB").format(new Date(defaultStartDate))} to{" "}
            {new Intl.DateTimeFormat("en-GB").format(new Date(defaultEndDate))}
          </p>
        </div>

        {/* DATE FILTER */}
        <div className="mb-6 print:hidden">
          <form method="GET" className="flex items-center gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                name="startDate"
                defaultValue={defaultStartDate}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                name="endDate"
                defaultValue={defaultEndDate}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
            </div>
            <button
              type="submit"
              className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 mt-6"
            >
              Update Report
            </button>
          </form>
        </div>

        {/* INCOME SECTION */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-green-700 mb-4 border-b border-gray-200 pb-2">
            INCOME
          </h3>
          <div className="space-y-2">
            {incomeAccountTotals.map((account) => (
              <div key={account.id} className="flex justify-between items-center py-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm text-gray-500">{account.code}</span>
                  <span>{account.name}</span>
                </div>
                <span className="font-medium">GHS {account.total.toLocaleString()}</span>
              </div>
            ))}
            <div className="border-t border-gray-300 pt-2 mt-4">
              <div className="flex justify-between items-center font-semibold text-lg">
                <span>Total Income</span>
                <span className="text-green-600">GHS {totalIncome.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* EXPENSES SECTION */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-red-700 mb-4 border-b border-gray-200 pb-2">
            EXPENSES
          </h3>
          <div className="space-y-2">
            {expenseAccountTotals.map((account) => (
              <div key={account.id} className="flex justify-between items-center py-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm text-gray-500">{account.code}</span>
                  <span>{account.name}</span>
                </div>
                <span className="font-medium">GHS {account.total.toLocaleString()}</span>
              </div>
            ))}
            <div className="border-t border-gray-300 pt-2 mt-4">
              <div className="flex justify-between items-center font-semibold text-lg">
                <span>Total Expenses</span>
                <span className="text-red-600">GHS {totalExpenses.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* NET INCOME */}
        <div className="border-t-2 border-gray-400 pt-4">
          <div className="flex justify-between items-center font-bold text-xl">
            <span>NET INCOME</span>
            <span className={`${netIncome >= 0 ? "text-green-600" : "text-red-600"}`}>
              GHS {netIncome.toLocaleString()}
            </span>
          </div>
        </div>

        {/* REPORT FOOTER */}
        <div className="mt-12 pt-8 border-t border-gray-200 text-center text-sm text-gray-500">
          <p>Generated on {new Intl.DateTimeFormat("en-GB").format(new Date())}</p>
          <p>This report was automatically generated by the School Management System</p>
        </div>
      </div>
    </div>
  );
};

export default IncomeStatementPage;