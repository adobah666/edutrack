import prisma from "@/lib/prisma";
import { getSchoolFilter } from "@/lib/school-context";
import Image from "next/image";
import Link from "next/link";

const AccountingDashboard = async () => {
  const schoolFilter = await getSchoolFilter();
  
  // Get financial summary data
  const [
    totalIncome,
    totalExpenses,
    recentTransactions,
    accountsCount,
    pendingPayments,
    totalAssets,
  ] = await Promise.all([
    // Total Income (from transactions)
    prisma.transaction.aggregate({
      where: {
        ...(schoolFilter.schoolId ? { schoolId: schoolFilter.schoolId } : {}),
        type: "INCOME",
      },
      _sum: { amount: true },
    }),
    
    // Total Expenses (from transactions)
    prisma.transaction.aggregate({
      where: {
        ...(schoolFilter.schoolId ? { schoolId: schoolFilter.schoolId } : {}),
        type: "EXPENSE",
      },
      _sum: { amount: true },
    }),
    
    // Recent transactions
    prisma.transaction.findMany({
      where: schoolFilter.schoolId ? { schoolId: schoolFilter.schoolId } : {},
      include: {
        mainAccount: true,
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    
    // Count of accounts
    prisma.account.count({
      where: {
        ...(schoolFilter.schoolId ? { schoolId: schoolFilter.schoolId } : {}),
        isActive: true,
      },
    }),
    
    // Pending salary payments (from payroll system)
    prisma.salaryPayment.aggregate({
      where: {
        ...(schoolFilter.schoolId ? { schoolId: schoolFilter.schoolId } : {}),
        status: { in: ["PENDING", "OVERDUE"] },
      },
      _sum: { amount: true },
    }),
    
    // Total from student fees (existing system)
    prisma.studentFee.aggregate({
      where: schoolFilter.schoolId ? { schoolId: schoolFilter.schoolId } : {},
      _sum: { amount: true },
    }),
  ]);

  const income = totalIncome._sum.amount || 0;
  const expenses = totalExpenses._sum.amount || 0;
  const netIncome = income - expenses;
  const pendingPayroll = pendingPayments._sum.amount || 0;
  const studentFeeIncome = totalAssets._sum.amount || 0;

  const stats = [
    {
      title: "Total Income",
      value: `GHS ${income.toLocaleString()}`,
      icon: "/finance.png",
      color: "bg-green-100 text-green-800",
      change: "+12.5%",
    },
    {
      title: "Total Expenses", 
      value: `GHS ${expenses.toLocaleString()}`,
      icon: "/finance.png",
      color: "bg-red-100 text-red-800",
      change: "+8.2%",
    },
    {
      title: "Net Income",
      value: `GHS ${netIncome.toLocaleString()}`,
      icon: "/result.png",
      color: netIncome >= 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800",
      change: netIncome >= 0 ? "+4.3%" : "-4.3%",
    },
    {
      title: "Pending Payroll",
      value: `GHS ${pendingPayroll.toLocaleString()}`,
      icon: "/finance.png",
      color: "bg-yellow-100 text-yellow-800",
      change: "Due Soon",
    },
  ];

  const quickActions = [
    {
      title: "Record Income",
      description: "Add income transaction",
      href: "/accounting/transactions/create?type=income",
      icon: "/create.png",
      color: "bg-green-500",
    },
    {
      title: "Record Expense", 
      description: "Add expense transaction",
      href: "/accounting/transactions/create?type=expense",
      icon: "/create.png",
      color: "bg-red-500",
    },
    {
      title: "View Reports",
      description: "Financial statements",
      href: "/accounting/reports",
      icon: "/result.png",
      color: "bg-blue-500",
    },
    {
      title: "Manage Accounts",
      description: "Chart of accounts",
      href: "/accounting/accounts",
      icon: "/setting.png",
      color: "bg-purple-500",
    },
  ];

  return (
    <div className="p-4 flex gap-4 flex-col">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Accounting Dashboard</h1>
        <div className="flex gap-2">
          <Link href="/accounting/transactions/create">
            <button className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 flex items-center gap-2">
              <Image src="/create.png" alt="" width={16} height={16} />
              New Transaction
            </button>
          </Link>
        </div>
      </div>

      {/* FINANCIAL STATS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className={`text-sm ${stat.color} px-2 py-1 rounded-full inline-block mt-2`}>
                  {stat.change}
                </p>
              </div>
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                <Image src={stat.icon} alt="" width={24} height={24} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* QUICK ACTIONS */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="space-y-3">
            {quickActions.map((action, index) => (
              <Link key={index} href={action.href}>
                <div className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors">
                  <div className={`w-10 h-10 ${action.color} rounded-full flex items-center justify-center`}>
                    <Image src={action.icon} alt="" width={20} height={20} className="brightness-0 invert" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{action.title}</p>
                    <p className="text-sm text-gray-600">{action.description}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* RECENT TRANSACTIONS */}
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Recent Transactions</h2>
            <Link href="/accounting/transactions" className="text-blue-600 hover:text-blue-800 text-sm">
              View All
            </Link>
          </div>
          <div className="space-y-3">
            {recentTransactions.length > 0 ? (
              recentTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      transaction.type === "INCOME" ? "bg-green-100" : "bg-red-100"
                    }`}>
                      <Image 
                        src={transaction.type === "INCOME" ? "/finance.png" : "/finance.png"} 
                        alt="" 
                        width={16} 
                        height={16} 
                        className={transaction.type === "INCOME" ? "" : "opacity-60"}
                      />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{transaction.description}</p>
                      <p className="text-sm text-gray-600">{transaction.mainAccount.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-medium ${
                      transaction.type === "INCOME" ? "text-green-600" : "text-red-600"
                    }`}>
                      {transaction.type === "INCOME" ? "+" : "-"}GHS {transaction.amount.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-600">
                      {new Intl.DateTimeFormat("en-GB").format(transaction.date)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Image src="/finance.png" alt="" width={48} height={48} className="mx-auto mb-4 opacity-50" />
                <p>No transactions yet</p>
                <p className="text-sm">Start by recording your first transaction</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* NAVIGATION CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/accounting/transactions">
          <div className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Image src="/finance.png" alt="" width={24} height={24} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Transactions</h3>
                <p className="text-sm text-gray-600">View all transactions</p>
              </div>
            </div>
          </div>
        </Link>

        <Link href="/accounting/accounts">
          <div className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Image src="/setting.png" alt="" width={24} height={24} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Accounts</h3>
                <p className="text-sm text-gray-600">Chart of accounts</p>
              </div>
            </div>
          </div>
        </Link>

        <Link href="/accounting/reports">
          <div className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Image src="/result.png" alt="" width={24} height={24} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Reports</h3>
                <p className="text-sm text-gray-600">Financial statements</p>
              </div>
            </div>
          </div>
        </Link>

        <Link href="/accounting/budget">
          <div className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <Image src="/calendar.png" alt="" width={24} height={24} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Budget</h3>
                <p className="text-sm text-gray-600">Budget planning</p>
              </div>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default AccountingDashboard;