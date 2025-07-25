import prisma from "@/lib/prisma";
import { getSchoolFilter } from "@/lib/school-context";
import Image from "next/image";
import Link from "next/link";
import CashFlowPrint from "@/components/CashFlowPrint";

const CashFlowPage = async ({
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

  // Get all transactions for the period
  const transactions = await prisma.transaction.findMany({
    where: {
      ...(schoolFilter.schoolId ? { schoolId: schoolFilter.schoolId } : {}),
      date: {
        gte: new Date(defaultStartDate),
        lte: new Date(defaultEndDate),
      },
    },
    include: {
      mainAccount: {
        select: {
          name: true,
          code: true,
          type: true,
          subType: true,
        },
      },
    },
    orderBy: { date: "asc" },
  });

  // Categorize transactions for cash flow
  const operatingActivities = transactions.filter(t => 
    t.mainAccount.type === "INCOME" || 
    (t.mainAccount.type === "EXPENSE" && t.mainAccount.subType === "OPERATING_EXPENSE")
  );

  const investingActivities = transactions.filter(t => 
    t.mainAccount.subType === "FIXED_ASSET" ||
    (t.mainAccount.type === "EXPENSE" && t.mainAccount.subType === "NON_OPERATING_EXPENSE")
  );

  const financingActivities = transactions.filter(t => 
    t.mainAccount.type === "LIABILITY" || 
    t.mainAccount.type === "EQUITY"
  );

  // Calculate cash flows
  const operatingCashFlow = operatingActivities.reduce((sum, t) => {
    return t.type === "INCOME" ? sum + t.amount : sum - t.amount;
  }, 0);

  const investingCashFlow = investingActivities.reduce((sum, t) => {
    return t.type === "INCOME" ? sum + t.amount : sum - t.amount;
  }, 0);

  const financingCashFlow = financingActivities.reduce((sum, t) => {
    return t.type === "INCOME" ? sum + t.amount : sum - t.amount;
  }, 0);

  const netCashFlow = operatingCashFlow + investingCashFlow + financingCashFlow;

  // Get cash balance at beginning of period
  const beginningCashTransactions = await prisma.transaction.findMany({
    where: {
      ...(schoolFilter.schoolId ? { schoolId: schoolFilter.schoolId } : {}),
      date: {
        lt: new Date(defaultStartDate),
      },
      mainAccount: {
        OR: [
          { code: "1001" }, // Cash account
          { code: "1002" }, // Bank account
        ],
      },
    },
  });

  const beginningCashBalance = beginningCashTransactions.reduce((sum, t) => {
    return t.type === "INCOME" ? sum + t.amount : sum - t.amount;
  }, 0);

  const endingCashBalance = beginningCashBalance + netCashFlow;

  // Group operating activities by type
  const incomeTransactions = operatingActivities.filter(t => t.type === "INCOME");
  const expenseTransactions = operatingActivities.filter(t => t.type === "EXPENSE");

  return (
    <div className="p-4 max-w-4xl mx-auto">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <Link href="/accounting/reports" className="text-blue-600 hover:text-blue-800 flex items-center gap-2">
          <span>←</span>
          Back to Reports
        </Link>
        <CashFlowPrint 
          reportData={{
            school: {
              name: school?.name ?? "School Name",
              address: school?.address ?? "",
              phone: school?.phone ?? ""
            },
            operatingActivities,
            investingActivities,
            financingActivities,
            operatingCashFlow,
            investingCashFlow,
            financingCashFlow,
            netCashFlow,
            beginningCashBalance,
            endingCashBalance,
            incomeTransactions,
            expenseTransactions,
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
          <h2 className="text-xl font-semibold mt-4 text-gray-800">Cash Flow Statement</h2>
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

        {/* OPERATING ACTIVITIES */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-blue-700 mb-4 border-b border-gray-200 pb-2">
            CASH FLOWS FROM OPERATING ACTIVITIES
          </h3>
          
          {/* Cash Receipts */}
          <div className="mb-4">
            <h4 className="font-medium text-green-700 mb-2">Cash Receipts:</h4>
            <div className="space-y-1 ml-4">
              {incomeTransactions.map((transaction) => (
                <div key={transaction.id} className="flex justify-between items-center py-1">
                  <span className="text-sm">{transaction.description}</span>
                  <span className="text-sm font-medium text-green-600">
                    GHS {transaction.amount.toLocaleString()}
                  </span>
                </div>
              ))}
              <div className="border-t border-gray-200 pt-1 mt-2">
                <div className="flex justify-between items-center font-medium">
                  <span>Total Cash Receipts</span>
                  <span className="text-green-600">
                    GHS {incomeTransactions.reduce((sum, t) => sum + t.amount, 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Cash Payments */}
          <div className="mb-4">
            <h4 className="font-medium text-red-700 mb-2">Cash Payments:</h4>
            <div className="space-y-1 ml-4">
              {expenseTransactions.map((transaction) => (
                <div key={transaction.id} className="flex justify-between items-center py-1">
                  <span className="text-sm">{transaction.description}</span>
                  <span className="text-sm font-medium text-red-600">
                    (GHS {transaction.amount.toLocaleString()})
                  </span>
                </div>
              ))}
              <div className="border-t border-gray-200 pt-1 mt-2">
                <div className="flex justify-between items-center font-medium">
                  <span>Total Cash Payments</span>
                  <span className="text-red-600">
                    (GHS {expenseTransactions.reduce((sum, t) => sum + t.amount, 0).toLocaleString()})
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-300 pt-2">
            <div className="flex justify-between items-center font-semibold text-lg">
              <span>Net Cash from Operating Activities</span>
              <span className={operatingCashFlow >= 0 ? "text-green-600" : "text-red-600"}>
                {operatingCashFlow >= 0 ? "" : "("}GHS {Math.abs(operatingCashFlow).toLocaleString()}{operatingCashFlow >= 0 ? "" : ")"}
              </span>
            </div>
          </div>
        </div>

        {/* INVESTING ACTIVITIES */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-purple-700 mb-4 border-b border-gray-200 pb-2">
            CASH FLOWS FROM INVESTING ACTIVITIES
          </h3>
          
          {investingActivities.length > 0 ? (
            <div className="space-y-1 ml-4">
              {investingActivities.map((transaction) => (
                <div key={transaction.id} className="flex justify-between items-center py-1">
                  <span className="text-sm">{transaction.description}</span>
                  <span className={`text-sm font-medium ${
                    transaction.type === "INCOME" ? "text-green-600" : "text-red-600"
                  }`}>
                    {transaction.type === "EXPENSE" ? "(" : ""}GHS {transaction.amount.toLocaleString()}{transaction.type === "EXPENSE" ? ")" : ""}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 ml-4">No investing activities for this period</p>
          )}

          <div className="border-t border-gray-300 pt-2 mt-4">
            <div className="flex justify-between items-center font-semibold text-lg">
              <span>Net Cash from Investing Activities</span>
              <span className={investingCashFlow >= 0 ? "text-green-600" : "text-red-600"}>
                {investingCashFlow >= 0 ? "" : "("}GHS {Math.abs(investingCashFlow).toLocaleString()}{investingCashFlow >= 0 ? "" : ")"}
              </span>
            </div>
          </div>
        </div>

        {/* FINANCING ACTIVITIES */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-orange-700 mb-4 border-b border-gray-200 pb-2">
            CASH FLOWS FROM FINANCING ACTIVITIES
          </h3>
          
          {financingActivities.length > 0 ? (
            <div className="space-y-1 ml-4">
              {financingActivities.map((transaction) => (
                <div key={transaction.id} className="flex justify-between items-center py-1">
                  <span className="text-sm">{transaction.description}</span>
                  <span className={`text-sm font-medium ${
                    transaction.type === "INCOME" ? "text-green-600" : "text-red-600"
                  }`}>
                    {transaction.type === "EXPENSE" ? "(" : ""}GHS {transaction.amount.toLocaleString()}{transaction.type === "EXPENSE" ? ")" : ""}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 ml-4">No financing activities for this period</p>
          )}

          <div className="border-t border-gray-300 pt-2 mt-4">
            <div className="flex justify-between items-center font-semibold text-lg">
              <span>Net Cash from Financing Activities</span>
              <span className={financingCashFlow >= 0 ? "text-green-600" : "text-red-600"}>
                {financingCashFlow >= 0 ? "" : "("}GHS {Math.abs(financingCashFlow).toLocaleString()}{financingCashFlow >= 0 ? "" : ")"}
              </span>
            </div>
          </div>
        </div>

        {/* NET CHANGE IN CASH */}
        <div className="border-t-2 border-gray-400 pt-4 mb-6">
          <div className="space-y-2">
            <div className="flex justify-between items-center font-semibold text-lg">
              <span>Net Change in Cash</span>
              <span className={netCashFlow >= 0 ? "text-green-600" : "text-red-600"}>
                {netCashFlow >= 0 ? "" : "("}GHS {Math.abs(netCashFlow).toLocaleString()}{netCashFlow >= 0 ? "" : ")"}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span>Cash at Beginning of Period</span>
              <span>GHS {beginningCashBalance.toLocaleString()}</span>
            </div>
            <div className="border-t border-gray-300 pt-2">
              <div className="flex justify-between items-center font-bold text-xl">
                <span>Cash at End of Period</span>
                <span className={endingCashBalance >= 0 ? "text-green-600" : "text-red-600"}>
                  GHS {endingCashBalance.toLocaleString()}
                </span>
              </div>
            </div>
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

export default CashFlowPage;