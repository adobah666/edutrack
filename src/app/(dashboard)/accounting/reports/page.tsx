import prisma from "@/lib/prisma";
import { getSchoolFilter } from "@/lib/school-context";
import Image from "next/image";
import Link from "next/link";
import ReportsPrintComponent from "@/components/ReportsPrintComponent";

const ReportsPage = async () => {
  const schoolFilter = await getSchoolFilter();
  
  // Get financial data for reports
  const [
    totalIncome,
    totalExpenses,
    assetAccounts,
    liabilityAccounts,
    equityAccounts,
    incomeAccounts,
    expenseAccounts,
    recentTransactions,
    school,
  ] = await Promise.all([
    // Total Income
    prisma.transaction.aggregate({
      where: {
        ...(schoolFilter.schoolId ? { schoolId: schoolFilter.schoolId } : {}),
        type: "INCOME",
      },
      _sum: { amount: true },
    }),
    
    // Total Expenses
    prisma.transaction.aggregate({
      where: {
        ...(schoolFilter.schoolId ? { schoolId: schoolFilter.schoolId } : {}),
        type: "EXPENSE",
      },
      _sum: { amount: true },
    }),

    // Asset accounts with balances
    prisma.account.findMany({
      where: {
        ...(schoolFilter.schoolId ? { schoolId: schoolFilter.schoolId } : {}),
        type: "ASSET",
        isActive: true,
      },
      include: {
        _count: {
          select: { transactions: true },
        },
      },
    }),

    // Liability accounts
    prisma.account.findMany({
      where: {
        ...(schoolFilter.schoolId ? { schoolId: schoolFilter.schoolId } : {}),
        type: "LIABILITY",
        isActive: true,
      },
      include: {
        _count: {
          select: { transactions: true },
        },
      },
    }),

    // Equity accounts
    prisma.account.findMany({
      where: {
        ...(schoolFilter.schoolId ? { schoolId: schoolFilter.schoolId } : {}),
        type: "EQUITY",
        isActive: true,
      },
      include: {
        _count: {
          select: { transactions: true },
        },
      },
    }),

    // Income accounts with totals
    prisma.account.findMany({
      where: {
        ...(schoolFilter.schoolId ? { schoolId: schoolFilter.schoolId } : {}),
        type: "INCOME",
        isActive: true,
      },
      include: {
        transactions: {
          where: { type: "INCOME" },
          select: { amount: true },
        },
      },
    }),

    // Expense accounts with totals
    prisma.account.findMany({
      where: {
        ...(schoolFilter.schoolId ? { schoolId: schoolFilter.schoolId } : {}),
        type: "EXPENSE",
        isActive: true,
      },
      include: {
        transactions: {
          where: { type: "EXPENSE" },
          select: { amount: true },
        },
      },
    }),

    // Recent transactions for cash flow
    prisma.transaction.findMany({
      where: schoolFilter.schoolId ? { schoolId: schoolFilter.schoolId } : {},
      include: {
        mainAccount: {
          select: { name: true, code: true },
        },
      },
      orderBy: { date: "desc" },
      take: 10,
    }),

    // Get school information
    prisma.school.findFirst({
      where: schoolFilter.schoolId ? { id: schoolFilter.schoolId } : {},
      select: { name: true, address: true, phone: true },
    }),
  ]);

  const income = totalIncome._sum.amount || 0;
  const expenses = totalExpenses._sum.amount || 0;
  const netIncome = income - expenses;

  // Calculate account totals
  const incomeAccountTotals = incomeAccounts.map(account => ({
    ...account,
    total: account.transactions.reduce((sum, t) => sum + t.amount, 0),
  }));

  const expenseAccountTotals = expenseAccounts.map(account => ({
    ...account,
    total: account.transactions.reduce((sum, t) => sum + t.amount, 0),
  }));

  return (
    <div className="p-4 flex gap-4 flex-col">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Financial Reports</h1>
        <div className="flex gap-2">
          <ReportsPrintComponent 
            reportData={{
              income,
              expenses,
              netIncome,
              incomeAccountTotals,
              expenseAccountTotals,
              assetAccounts,
              liabilityAccounts,
              equityAccounts,
              recentTransactions,
              school: school || { name: "School Name", address: "", phone: "" }
            }}
          />
        </div>
      </div>

      {/* FINANCIAL SUMMARY */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600">Total Income</p>
              <p className="text-3xl font-bold text-green-800">GHS {income.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <Image src="/finance.png" alt="" width={24} height={24} />
            </div>
          </div>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-600">Total Expenses</p>
              <p className="text-3xl font-bold text-red-800">GHS {expenses.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <Image src="/finance.png" alt="" width={24} height={24} />
            </div>
          </div>
        </div>

        <div className={`${netIncome >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-red-50 border-red-200'} border rounded-lg p-6`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${netIncome >= 0 ? 'text-blue-600' : 'text-red-600'}`}>Net Income</p>
              <p className={`text-3xl font-bold ${netIncome >= 0 ? 'text-blue-800' : 'text-red-800'}`}>
                GHS {netIncome.toLocaleString()}
              </p>
            </div>
            <div className={`w-12 h-12 ${netIncome >= 0 ? 'bg-blue-100' : 'bg-red-100'} rounded-full flex items-center justify-center`}>
              <Image src="/result.png" alt="" width={24} height={24} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* INCOME STATEMENT */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-lg font-semibold mb-4">Income Statement</h2>
          
          {/* INCOME SECTION */}
          <div className="mb-6">
            <h3 className="font-medium text-green-700 mb-3">Income</h3>
            <div className="space-y-2">
              {incomeAccountTotals.map((account) => (
                <div key={account.id} className="flex justify-between text-sm">
                  <span>{account.name}</span>
                  <span className="text-green-600">GHS {account.total.toLocaleString()}</span>
                </div>
              ))}
              <div className="border-t pt-2 flex justify-between font-medium">
                <span>Total Income</span>
                <span className="text-green-600">GHS {income.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* EXPENSES SECTION */}
          <div className="mb-6">
            <h3 className="font-medium text-red-700 mb-3">Expenses</h3>
            <div className="space-y-2">
              {expenseAccountTotals.map((account) => (
                <div key={account.id} className="flex justify-between text-sm">
                  <span>{account.name}</span>
                  <span className="text-red-600">GHS {account.total.toLocaleString()}</span>
                </div>
              ))}
              <div className="border-t pt-2 flex justify-between font-medium">
                <span>Total Expenses</span>
                <span className="text-red-600">GHS {expenses.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* NET INCOME */}
          <div className="border-t-2 pt-4">
            <div className="flex justify-between font-bold text-lg">
              <span>Net Income</span>
              <span className={netIncome >= 0 ? "text-green-600" : "text-red-600"}>
                GHS {netIncome.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* BALANCE SHEET PREVIEW */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-lg font-semibold mb-4">Balance Sheet Preview</h2>
          
          {/* ASSETS */}
          <div className="mb-4">
            <h3 className="font-medium text-blue-700 mb-2">Assets</h3>
            <div className="space-y-1">
              {assetAccounts.map((account) => (
                <div key={account.id} className="flex justify-between text-sm">
                  <span>{account.name}</span>
                  <span>{account._count.transactions} transactions</span>
                </div>
              ))}
            </div>
          </div>

          {/* LIABILITIES */}
          <div className="mb-4">
            <h3 className="font-medium text-red-700 mb-2">Liabilities</h3>
            <div className="space-y-1">
              {liabilityAccounts.length > 0 ? (
                liabilityAccounts.map((account) => (
                  <div key={account.id} className="flex justify-between text-sm">
                    <span>{account.name}</span>
                    <span>{account._count.transactions} transactions</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">No liability accounts</p>
              )}
            </div>
          </div>

          {/* EQUITY */}
          <div>
            <h3 className="font-medium text-purple-700 mb-2">Equity</h3>
            <div className="space-y-1">
              {equityAccounts.length > 0 ? (
                equityAccounts.map((account) => (
                  <div key={account.id} className="flex justify-between text-sm">
                    <span>{account.name}</span>
                    <span>{account._count.transactions} transactions</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">No equity accounts</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* RECENT TRANSACTIONS */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Recent Transactions</h2>
          <Link href="/accounting/transactions" className="text-blue-600 hover:text-blue-800 text-sm">
            View All
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Date</th>
                <th className="text-left p-2">Reference</th>
                <th className="text-left p-2">Description</th>
                <th className="text-left p-2">Account</th>
                <th className="text-right p-2">Amount</th>
                <th className="text-center p-2">Type</th>
              </tr>
            </thead>
            <tbody>
              {recentTransactions.map((transaction) => (
                <tr key={transaction.id} className="border-b hover:bg-gray-50">
                  <td className="p-2">{new Intl.DateTimeFormat("en-GB").format(transaction.date)}</td>
                  <td className="p-2 font-mono">{transaction.reference}</td>
                  <td className="p-2">{transaction.description}</td>
                  <td className="p-2">{transaction.mainAccount.name}</td>
                  <td className={`p-2 text-right font-medium ${
                    transaction.type === "INCOME" ? "text-green-600" : "text-red-600"
                  }`}>
                    {transaction.type === "INCOME" ? "+" : "-"}GHS {transaction.amount.toLocaleString()}
                  </td>
                  <td className="p-2 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      transaction.type === "INCOME" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                    }`}>
                      {transaction.type}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* REPORT ACTIONS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border text-center">
          <Image src="/result.png" alt="" width={32} height={32} className="mx-auto mb-2" />
          <h3 className="font-medium mb-2">Detailed Income Statement</h3>
          <p className="text-sm text-gray-600 mb-3">Complete profit & loss report</p>
          <Link href="/accounting/reports/income-statement">
            <button className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 text-sm">
              Generate Report
            </button>
          </Link>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border text-center">
          <Image src="/finance.png" alt="" width={32} height={32} className="mx-auto mb-2" />
          <h3 className="font-medium mb-2">Balance Sheet</h3>
          <p className="text-sm text-gray-600 mb-3">Assets, liabilities & equity</p>
          <Link href="/accounting/reports/balance-sheet">
            <button className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 text-sm">
              Generate Report
            </button>
          </Link>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border text-center">
          <Image src="/calendar.png" alt="" width={32} height={32} className="mx-auto mb-2" />
          <h3 className="font-medium mb-2">Cash Flow Statement</h3>
          <p className="text-sm text-gray-600 mb-3">Money in and money out</p>
          <Link href="/accounting/reports/cash-flow">
            <button className="bg-purple-500 text-white px-4 py-2 rounded-md hover:bg-purple-600 text-sm">
              Generate Report
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;