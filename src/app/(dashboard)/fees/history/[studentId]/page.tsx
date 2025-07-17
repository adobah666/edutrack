import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import FormModal from "@/components/FormModal";
import ViewReceiptButton from "@/components/ViewReceiptButton";
import { ITEM_PER_PAGE } from "@/lib/settings";

const PaymentHistoryPage = async ({
  params,
  searchParams,
}: {
  params: { studentId: string };
  searchParams: { [key: string]: string | undefined };
}) => {
  const { userId, sessionClaims } = auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  const currentUserId = userId;

  const { page, ...queryParams } = searchParams;
  const p = page ? parseInt(page) : 1;

  // Get the student details
  const student = await prisma.student.findUnique({
    where: { id: params.studentId },
    include: {
      class: true,
    },
  });

  if (!student) {
    notFound();
  }

  // Verify if the user has access to this student's data
  if (role === "parent" && student.parentId !== currentUserId) {
    return { redirect: { destination: "/fees", permanent: false } };
  }

  // Build the query for student fees
  const query: any = {
    studentId: params.studentId,
  };

  // Get student's payment history
  const [payments, count] = await prisma.$transaction([
    prisma.studentFee.findMany({
      where: query,
      include: {
        classFee: {
          include: {
            feeType: true,
          },
        },
      },
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
      orderBy: { paidDate: "desc" },
    }),
    prisma.studentFee.count({ where: query }),
  ]);

  return (
    <div className="bg-white p-4 rounded-lg">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800 mb-2">
          Payment History - {student.name} {student.surname}
        </h1>
        <div className="text-gray-600">
          <p>Class: {student.class.name}</p>
        </div>
      </div>

      <div className="overflow-x-auto mt-6">
        <table className="min-w-full text-sm">
          <thead>
            <tr>
              <th className="border-b border-gray-200 bg-gray-50 px-5 py-3 text-left">
                Fee Type
              </th>
              <th className="border-b border-gray-200 bg-gray-50 px-5 py-3 text-left">
                Amount Paid
              </th>              <th className="border-b border-gray-200 bg-gray-50 px-5 py-3 text-left">
                Payment Date
              </th>
              {role === "admin" && (
                <th className="border-b border-gray-200 bg-gray-50 px-5 py-3 text-left">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {payments.map((payment) => (
              <tr key={payment.id} className="hover:bg-gray-50">
                <td className="border-b border-gray-200 px-5 py-3">
                  {payment.classFee.feeType.name}
                </td>
                <td className="border-b border-gray-200 px-5 py-3">
                  GH₵{payment.amount.toFixed(2)}
                </td>                <td className="border-b border-gray-200 px-5 py-3">
                  {new Date(payment.paidDate).toLocaleDateString()}
                </td>
                <td className="border-b border-gray-200 px-5 py-3">
                  <div className="flex items-center gap-2">
                    <ViewReceiptButton paymentId={payment.id} />
                    {role === "admin" && (
                      <FormModal
                        table="studentFee"
                        type="delete"
                        data={{ id: payment.id }}
                      />
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PaymentHistoryPage;
