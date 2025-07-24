import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import PaymentHistoryTable from "@/components/PaymentHistoryTable";
import prisma from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { requireSchoolAccess } from "@/lib/school-context";
import Image from "next/image";
import { notFound } from "next/navigation";

const PayrollDetailPage = async ({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { [key: string]: string | undefined };
}) => {
  const { page } = searchParams;
  const p = page ? parseInt(page) : 1;

  const staffSalary = await prisma.staffSalary.findUnique({
    where: {
      id: parseInt(params.id),
    },
    include: {
      teacher: {
        select: {
          id: true,
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
    notFound();
  }

  // Check school access
  await requireSchoolAccess(staffSalary.schoolId);

  // First, update any overdue payments
  const today = new Date();
  await prisma.salaryPayment.updateMany({
    where: {
      salaryId: staffSalary.id,
      status: "PENDING",
      dueDate: {
        lt: today,
      },
    },
    data: {
      status: "OVERDUE",
    },
  });

  // Get payment history
  const [payments, paymentsCount] = await prisma.$transaction([
    prisma.salaryPayment.findMany({
      where: {
        salaryId: staffSalary.id,
      },
      orderBy: {
        payPeriodStart: "desc",
      },
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
    }),
    prisma.salaryPayment.count({
      where: {
        salaryId: staffSalary.id,
      },
    }),
  ]);

  // Get bonuses
  const bonuses = await prisma.staffBonus.findMany({
    where: {
      salaryId: staffSalary.id,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 5,
  });



  return (
    <div className="flex-1 p-4 flex flex-col gap-4 xl:flex-row">
      {/* LEFT */}
      <div className="w-full xl:w-2/3">
        {/* TOP */}
        <div className="flex flex-col lg:flex-row gap-4">
          {/* USER INFO CARD */}
          <div className="bg-lamaSky py-6 px-4 rounded-md flex-1 flex gap-4">
            <div className="w-1/3">
              <Image
                src={staffSalary.teacher.img || "/noAvatar.png"}
                alt=""
                width={144}
                height={144}
                className="w-36 h-36 rounded-full object-cover"
              />
            </div>
            <div className="w-2/3 flex flex-col justify-between gap-4">
              <div className="flex items-center gap-4">
                <h1 className="text-xl font-semibold">
                  {staffSalary.teacher.name} {staffSalary.teacher.surname}
                </h1>
              </div>
              <p className="text-sm text-gray-500">
                Staff member at {staffSalary.school.name}
              </p>
              <div className="flex items-center justify-between gap-2 flex-wrap text-xs font-medium">
                <div className="w-full md:w-1/3 lg:w-full 2xl:w-1/3 flex items-center gap-2">
                  <Image src="/mail.png" alt="" width={14} height={14} />
                  <span>{staffSalary.teacher.email}</span>
                </div>
                <div className="w-full md:w-1/3 lg:w-full 2xl:w-1/3 flex items-center gap-2">
                  <Image src="/phone.png" alt="" width={14} height={14} />
                  <span>{staffSalary.teacher.phone || "N/A"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* SALARY INFO CARD */}
          <div className="flex-1 flex gap-4 justify-between flex-wrap">
            <div className="bg-white p-4 rounded-md flex gap-4 w-full md:w-[48%] xl:w-[45%] 2xl:w-[48%]">
              <Image
                src="/singleAttendance.png"
                alt=""
                width={24}
                height={24}
                className="w-6 h-6"
              />
              <div className="">
                <h1 className="text-xl font-semibold">
                  {staffSalary.currency} {staffSalary.baseSalary.toLocaleString()}
                </h1>
                <span className="text-sm text-gray-400">Base Salary</span>
              </div>
            </div>
            <div className="bg-white p-4 rounded-md flex gap-4 w-full md:w-[48%] xl:w-[45%] 2xl:w-[48%]">
              <Image
                src="/singleBranch.png"
                alt=""
                width={24}
                height={24}
                className="w-6 h-6"
              />
              <div className="">
                <h1 className="text-xl font-semibold">{staffSalary.payFrequency}</h1>
                <span className="text-sm text-gray-400">Pay Frequency</span>
              </div>
            </div>
            <div className="bg-white p-4 rounded-md flex gap-4 w-full md:w-[48%] xl:w-[45%] 2xl:w-[48%]">
              <Image
                src="/singleLesson.png"
                alt=""
                width={24}
                height={24}
                className="w-6 h-6"
              />
              <div className="">
                <h1 className="text-xl font-semibold">
                  {payments.filter(p => p.status === "PAID").length}
                </h1>
                <span className="text-sm text-gray-400">Payments Made</span>
              </div>
            </div>
            <div className="bg-white p-4 rounded-md flex gap-4 w-full md:w-[48%] xl:w-[45%] 2xl:w-[48%]">
              <Image
                src="/singleClass.png"
                alt=""
                width={24}
                height={24}
                className="w-6 h-6"
              />
              <div className="">
                <h1 className="text-xl font-semibold">
                  {staffSalary.isActive ? "Active" : "Inactive"}
                </h1>
                <span className="text-sm text-gray-400">Status</span>
              </div>
            </div>
          </div>
        </div>

        {/* PAYMENT HISTORY */}
        <div className="mt-4 bg-white rounded-md p-4">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold">Payment History</h1>
            <div className="flex gap-2">
              <FormContainer table="salaryPayment" type="create" data={{ salaryId: staffSalary.id }} />
            </div>
          </div>
          <PaymentHistoryTable data={payments} currency={staffSalary.currency} />
          <Pagination page={p} count={paymentsCount} />
        </div>
      </div>

      {/* RIGHT */}
      <div className="w-full xl:w-1/3 flex flex-col gap-4">
        {/* BONUSES */}
        <div className="bg-white p-4 rounded-md">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold">Recent Bonuses</h1>
            <FormContainer table="staffBonus" type="create" data={{ salaryId: staffSalary.id }} />
          </div>
          <div className="mt-4 flex flex-col gap-4">
            {bonuses.length > 0 ? (
              bonuses.map((bonus) => (
                <div key={bonus.id} className="p-3 bg-gray-50 rounded-md">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">
                      {staffSalary.currency} {bonus.amount.toLocaleString()}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      bonus.status === "PAID" 
                        ? "bg-green-100 text-green-800"
                        : bonus.status === "PENDING"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                    }`}>
                      {bonus.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{bonus.reason}</p>
                  <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                    <span>{bonus.bonusType}</span>
                    <span>Due: {new Intl.DateTimeFormat("en-GB").format(bonus.dueDate)}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No bonuses yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PayrollDetailPage;