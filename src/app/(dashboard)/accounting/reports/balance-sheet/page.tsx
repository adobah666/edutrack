import prisma from "@/lib/prisma";
import { getSchoolFilter } from "@/lib/school-context";
import Image from "next/image";
import Link from "next/link";
import BalanceSheetPrint from "@/components/BalanceSheetPrint";

const BalanceSheetPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const schoolFilter = await getSchoolFilter();
  const { asOfDate } = searchParams;
  
  // Default to current date if no date provided
  const defaultAsOfDate = asOfDate || new Date().toISOString().split('T')[0];

  // Get school information
  const school = await prisma.school.findFirst({
    where: schoolFilter.schoolId ? { id: schoolFilter.schoolId } : {},
    select: { name: true, address: true, phone: true },
  });

  // Get asset accounts with transaction totals
  const assetAccounts = await prisma.account.findMany({
    where: {
      ...(schoolFilter.schoolId ? { schoolId: schoolFilter.schoolId } : {}),
      type: "ASSET",
      isActive: true,
    },
    include: {
      transactions: {
        where: {
          date: {
            lte: new Date(defaultAsOfDate),
          },
        },
        select: { amount: true, type: true },
      },
    },
    orderBy: { code: "asc" },
  });

  // Get liability accounts with transaction totals
  const liabilityAccounts = await prisma.account.findMany({
    where: {
      ...(schoolFilter.schoolId ? { schoolId: schoolFilter.schoolId } : {}),
      type: "LIABILITY",
      isActive: true,
    },
    include: {
      transactions: {
        where: {
          date: {
            lte: new Date(defaultAsOfDate),
          },
        },
        select: { amount: true, type: true },
      },
    },
    orderBy: { code: "asc" },
  });

  // Get equity accounts with transaction totals
  const equityAccounts = await prisma.account.findMany({
    where: {
      ...(schoolFilter.schoolId ? { schoolId: schoolFilter.schoolId } : {}),
      type: "EQUITY",
      isActive: true,
    },
    include: {
      transactions: {
        where: {
          date: {
            lte: new Date(defaultAsOfDate),
          },
        },
        select: { amount: true, type: true },
      },
    },
    orderBy: { code: "asc" },
  });

  // Calculate net income up to the date (for retained earnings)
  const [totalIncome, totalExpenses] = await Promise.all([
    prisma.transaction.aggregate({
      where: {
        ...(schoolFilter.schoolId ? { schoolId: schoolFilter.schoolId } : {}),
        type: "INCOME",
        date: {
          lte: new Date(defaultAsOfDate),
        },
      },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: {
        ...(schoolFilter.schoolId ? { schoolId: schoolFilter.schoolId } : {}),
        type: "EXPENSE",
        date: {
          lte: new Date(defaultAsOfDate),
        },
      },
      _sum: { amount: true },
    }),
  ]);

  const netIncome = (totalIncome._sum.amount || 0) - (totalExpenses._sum.amount || 0);

  // Calculate account balances (for assets: debits increase, credits decrease)
  const calculateAssetBalance = (transactions: any[]) => {
    return transactions.reduce((balance, t) => {
      // For assets: INCOME transactions are credits (decrease), EXPENSE transactions are debits (increase)
      // But since we're dealing with cash flow, we need to think about it differently
      // Income increases cash (asset), expenses decrease cash (asset)
      if (t.type === "INCOME") return balance + t.amount;
      if (t.type === "EXPENSE") return balance - t.amount;
      return balance;
    }, 0);
  };

  const calculateLiabilityBalance = (transactions: any[]) => {
    return transactions.reduce((balance, t) => {
      // For liabilities: credits increase, debits decrease
      if (t.type === "INCOME") return balance - t.amount;
      if (t.type === "EXPENSE") return balance + t.amount;
      return balance;
    }, 0);
  };

  // Calculate totals
  const assetAccountTotals = assetAccounts.map(account => ({
    ...account,
    balance: calculateAssetBalance(account.transactions),
  }));

  const liabilityAccountTotals = liabilityAccounts.map(account => ({
    ...account,
    balance: calculateLiabilityBalance(account.transactions),
  }));

  const equityAccountTotals = equityAccounts.map(account => ({
    ...account,
    balance: calculateLiabilityBalance(account.transactions), // Equity behaves like liabilities
  }));

  const totalAssets = assetAccountTotals.reduce((sum, acc) => sum + acc.balance, 0);
  const totalLiabilities = liabilityAccountTotals.reduce((sum, acc) => sum + acc.balance, 0);
  const totalEquity = equityAccountTotals.reduce((sum, acc) => sum + acc.balance, 0) + netIncome;

  return (
    <div className="p-4 max-w-4xl mx-auto">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <Link href="/accounting/reports" className="text-blue-600 hover:text-blue-800 flex items-center gap-2">
          <span>←</span>
          Back to Reports
        </Link>
        <BalanceSheetPrint 
          reportData={{
            school: school || { name: "School Name", address: "", phone: "" },
            assetAccountTotals,
            liabilityAccountTotals,
            equityAccountTotals,
            totalAssets,
            totalLiabilities,
            totalEquity,
            netIncome,
            asOfDate: defaultAsOfDate
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
          <h2 className="text-xl font-semibold mt-4 text-gray-800">Balance Sheet</h2>
          <p className="text-gray-600">
            As of {new Intl.DateTimeFormat("en-GB").format(new Date(defaultAsOfDate))}
          </p>
        </div>

        {/* DATE FILTER */}
        <div className="mb-6 print:hidden">
          <form method="GET" className="flex items-center gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">As of Date</label>
              <input
                type="date"
                name="asOfDate"
                defaultValue={defaultAsOfDate}
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* LEFT SIDE - ASSETS */}
          <div>
            <h3 className="text-lg font-semibold text-blue-700 mb-4 border-b border-gray-200 pb-2">
              ASSETS
            </h3>
            
            {/* Current Assets */}
            <div className="mb-6">
              <h4 className="font-medium text-gray-700 mb-2">Current Assets</h4>
              <div className="space-y-1 ml-4">
                {assetAccountTotals
                  .filter(account => account.subType === "CURRENT_ASSET")
                  .map((account) => (
                    <div key={account.id} className="flex justify-between items-center py-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm text-gray-500">{account.code}</span>
                        <span className="text-sm">{account.name}</span>
                      </div>
                      <span className="text-sm font-medium">GHS {account.balance.toLocaleString()}</span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Fixed Assets */}
            <div className="mb-6">
              <h4 className="font-medium text-gray-700 mb-2">Fixed Assets</h4>
              <div className="space-y-1 ml-4">
                {assetAccountTotals
                  .filter(account => account.subType === "FIXED_ASSET")
                  .map((account) => (
                    <div key={account.id} className="flex justify-between items-center py-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm text-gray-500">{account.code}</span>
                        <span className="text-sm">{account.name}</span>
                      </div>
                      <span className="text-sm font-medium">GHS {account.balance.toLocaleString()}</span>
                    </div>
                  ))}
              </div>
            </div>

            <div className="border-t border-gray-300 pt-2">
              <div className="flex justify-between items-center font-semibold text-lg">
                <span>Total Assets</span>
                <span className="text-blue-600">GHS {totalAssets.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE - LIABILITIES & EQUITY */}
          <div>
            {/* LIABILITIES */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-red-700 mb-4 border-b border-gray-200 pb-2">
                LIABILITIES
              </h3>
              
              {/* Current Liabilities */}
              <div className="mb-4">
                <h4 className="font-medium text-gray-700 mb-2">Current Liabilities</h4>
                <div className="space-y-1 ml-4">
                  {liabilityAccountTotals
                    .filter(account => account.subType === "CURRENT_LIABILITY")
                    .map((account) => (
                      <div key={account.id} className="flex justify-between items-center py-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm text-gray-500">{account.code}</span>
                          <span className="text-sm">{account.name}</span>
                        </div>
                        <span className="text-sm font-medium">GHS {account.balance.toLocaleString()}</span>
                      </div>
                    ))}
                </div>
              </div>

              {/* Long-term Liabilities */}
              <div className="mb-4">
                <h4 className="font-medium text-gray-700 mb-2">Long-term Liabilities</h4>
                <div className="space-y-1 ml-4">
                  {liabilityAccountTotals
                    .filter(account => account.subType === "LONG_TERM_LIABILITY")
                    .map((account) => (
                      <div key={account.id} className="flex justify-between items-center py-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm text-gray-500">{account.code}</span>
                          <span className="text-sm">{account.name}</span>
                        </div>
                        <span className="text-sm font-medium">GHS {account.balance.toLocaleString()}</span>
                      </div>
                    ))}
                </div>
              </div>

              <div className="border-t border-gray-300 pt-2 mb-6">
                <div className="flex justify-between items-center font-semibold">
                  <span>Total Liabilities</span>
                  <span className="text-red-600">GHS {totalLiabilities.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* EQUITY */}
            <div>
              <h3 className="text-lg font-semibold text-purple-700 mb-4 border-b border-gray-200 pb-2">
                EQUITY
              </h3>
              
              <div className="space-y-1 ml-4 mb-4">
                {equityAccountTotals.map((account) => (
                  <div key={account.id} className="flex justify-between items-center py-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm text-gray-500">{account.code}</span>
                      <span className="text-sm">{account.name}</span>
                    </div>
                    <span className="text-sm font-medium">GHS {account.balance.toLocaleString()}</span>
                  </div>
                ))}
                
                {/* Retained Earnings (Net Income) */}
                <div className="flex justify-between items-center py-1">
                  <span className="text-sm">Retained Earnings</span>
                  <span className="text-sm font-medium">GHS {netIncome.toLocaleString()}</span>
                </div>
              </div>

              <div className="border-t border-gray-300 pt-2">
                <div className="flex justify-between items-center font-semibold">
                  <span>Total Equity</span>
                  <span className="text-purple-600">GHS {totalEquity.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* TOTAL LIABILITIES & EQUITY */}
            <div className="border-t-2 border-gray-400 pt-4 mt-6">
              <div className="flex justify-between items-center font-bold text-lg">
                <span>Total Liabilities & Equity</span>
                <span>GHS {(totalLiabilities + totalEquity).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* BALANCE CHECK */}
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="font-medium">Balance Check:</span>
            <span className={`font-bold ${
              Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01 
                ? "text-green-600" 
                : "text-red-600"
            }`}>
              {Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01 
                ? "✓ Balanced" 
                : "⚠ Not Balanced"}
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

export default BalanceSheetPage;