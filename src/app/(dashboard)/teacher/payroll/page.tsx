import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import Image from "next/image";
import { notFound } from "next/navigation";

const TeacherPayrollPage = async () => {
  const { userId } = auth();

  if (!userId) {
    return notFound();
  }

  // Get teacher's salary information
  const staffSalary = await prisma.staffSalary.findUnique({
    where: {
      teacherId: userId,
    },
    include: {
      teacher: {
        select: {
          name: true,
          surname: true,
          email: true,
          phone: true,
          img: true,
        },
      },
      school: {
        select: {
          name: true,
        },
      },
    },
  });

  if (!staffSalary) {
    return (
      <div className="flex-1 p-4">
        <div className="bg-white rounded-md p-8 text-center">
          <Image
            src="/noAvatar.png"
            alt="No payroll data"
            width={100}
            height={100}
            className="mx-auto mb-4 opacity-50"
          />
          <h2 className="text-xl font-semibold text-gray-600 mb-2">No Payroll Information</h2>
          <p className="text-gray-500">
            Your payroll information has not been set up yet. Please contact your administrator.
          </p>
        </div>
      </div>
    );
  }

  // Get recent payments
  const recentPayments = await prisma.salaryPayment.findMany({
    where: {
      salaryId: staffSalary.id,
    },
    orderBy: {
      payPeriodStart: "desc",
    },
    take: 5,
  });

  // Get recent bonuses
  const recentBonuses = await prisma.staffBonus.findMany({
    where: {
      salaryId: staffSalary.id,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 5,
  });

  // Calculate statistics
  const totalPaid = recentPayments
    .filter(p => p.status === "PAID")
    .reduce((sum, p) => sum + p.amount, 0);

  const pendingPayments = recentPayments.filter(p => p.status === "PENDING");
  const nextPayment = pendingPayments.sort((a, b) => 
    new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
  )[0];

  const totalBonuses = recentBonuses
    .filter(b => b.status === "PAID")
    .reduce((sum, b) => sum + b.amount, 0);

  return (
    <div className="flex-1 p-4 flex flex-col gap-4">
      {/* HEADER */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-md">
        <div className="flex items-center gap-4">
          <Image
            src={staffSalary.teacher.img || "/noAvatar.png"}
            alt=""
            width={80}
            height={80}
            className="w-20 h-20 rounded-full object-cover border-4 border-white"
          />
          <div>
            <h1 className="text-2xl font-bold">
              {staffSalary.teacher.name} {staffSalary.teacher.surname}
            </h1>
            <p className="text-blue-100">Staff Member at {staffSalary.school.name}</p>
            <p className="text-blue-100 text-sm">
              Base Salary: {staffSalary.currency} {staffSalary.baseSalary.toLocaleString()} ({staffSalary.payFrequency})
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* SALARY INFO */}
        <div className="bg-white p-4 rounded-md flex gap-4">
          <Image
            src="/singleAttendance.png"
            alt=""
            width={24}
            height={24}
            className="w-6 h-6"
          />
          <div>
            <h1 className="text-xl font-semibold">
              {staffSalary.currency} {staffSalary.baseSalary.toLocaleString()}
            </h1>
            <span className="text-sm text-gray-400">Base Salary</span>
          </div>
        </div>

        {/* TOTAL PAID */}
        <div className="bg-white p-4 rounded-md flex gap-4">
          <Image
            src="/singleBranch.png"
            alt=""
            width={24}
            height={24}
            className="w-6 h-6"
          />
          <div>
            <h1 className="text-xl font-semibold">
              {staffSalary.currency} {totalPaid.toLocaleString()}
            </h1>
            <span className="text-sm text-gray-400">Total Paid</span>
          </div>
        </div>

        {/* TOTAL BONUSES */}
        <div className="bg-white p-4 rounded-md flex gap-4">
          <Image
            src="/singleLesson.png"
            alt=""
            width={24}
            height={24}
            className="w-6 h-6"
          />
          <div>
            <h1 className="text-xl font-semibold">
              {staffSalary.currency} {totalBonuses.toLocaleString()}
            </h1>
            <span className="text-sm text-gray-400">Total Bonuses</span>
          </div>
        </div>

        {/* NEXT PAYMENT */}
        <div className="bg-white p-4 rounded-md flex gap-4">
          <Image
            src="/singleClass.png"
            alt=""
            width={24}
            height={24}
            className="w-6 h-6"
          />
          <div>
            <h1 className="text-xl font-semibold">
              {nextPayment ? `${staffSalary.currency} ${nextPayment.amount.toLocaleString()}` : "None"}
            </h1>
            <span className="text-sm text-gray-400">Next Payment</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* RECENT PAYMENTS */}
        <div className="bg-white p-4 rounded-md">
          <h1 className="text-lg font-semibold mb-4">Recent Payments</h1>
          <div className="space-y-3">
            {recentPayments.length > 0 ? (
              recentPayments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                  <div>
                    <div className="font-medium">
                      {staffSalary.currency} {payment.amount.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Intl.DateTimeFormat("en-GB").format(payment.payPeriodStart)} - 
                      {new Intl.DateTimeFormat("en-GB").format(payment.payPeriodEnd)}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      payment.status === "PAID" 
                        ? "bg-green-100 text-green-800"
                        : payment.status === "PENDING"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                    }`}>
                      {payment.status}
                    </span>
                    <div className="text-xs text-gray-500 mt-1">
                      Due: {new Intl.DateTimeFormat("en-GB").format(payment.dueDate)}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No payment history yet</p>
            )}
          </div>
        </div>

        {/* RECENT BONUSES */}
        <div className="bg-white p-4 rounded-md">
          <h1 className="text-lg font-semibold mb-4">Recent Bonuses</h1>
          <div className="space-y-3">
            {recentBonuses.length > 0 ? (
              recentBonuses.map((bonus) => (
                <div key={bonus.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                  <div>
                    <div className="font-medium">
                      {staffSalary.currency} {bonus.amount.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">{bonus.reason}</div>
                    <div className="text-xs text-gray-500">{bonus.bonusType}</div>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      bonus.status === "PAID" 
                        ? "bg-green-100 text-green-800"
                        : bonus.status === "PENDING"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                    }`}>
                      {bonus.status}
                    </span>
                    <div className="text-xs text-gray-500 mt-1">
                      Due: {new Intl.DateTimeFormat("en-GB").format(bonus.dueDate)}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No bonuses yet</p>
            )}
          </div>
        </div>
      </div>

      {/* UPCOMING PAYMENTS */}
      {nextPayment && (
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-md">
          <h2 className="text-lg font-semibold text-yellow-800 mb-2">Upcoming Payment</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-700">
                <span className="font-medium">{staffSalary.currency} {nextPayment.amount.toLocaleString()}</span> 
                {" "}for period {new Intl.DateTimeFormat("en-GB").format(nextPayment.payPeriodStart)} - 
                {new Intl.DateTimeFormat("en-GB").format(nextPayment.payPeriodEnd)}
              </p>
              <p className="text-sm text-yellow-600">
                Due: {new Intl.DateTimeFormat("en-GB").format(nextPayment.dueDate)}
              </p>
            </div>
            <span className="px-3 py-1 bg-yellow-200 text-yellow-800 rounded-full text-sm font-medium">
              Pending
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherPayrollPage;