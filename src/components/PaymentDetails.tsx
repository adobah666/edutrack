import { Class, ClassFee, FeeType, Student, StudentFee } from "@prisma/client";
import TableSearch from "./TableSearch";
import Pagination from "./Pagination";
import FormModal from "./FormModal";
import { auth } from "@clerk/nextjs/server";
import Image from "next/image";
import Link from "next/link";

type PaymentDetailsProps = {
  classFee: ClassFee & {
    class: Class | null;
    feeType: FeeType;
  };
  students: (Student & {
    studentFees: StudentFee[];
  })[];
  count: number;
  page: number;
};

const PaymentDetails = async ({
  classFee,
  students,
  count,
  page,
}: PaymentDetailsProps) => {
  const { sessionClaims } = auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  const columns = [
    {
      header: "Student Name",
      accessor: "name",
    },
    {
      header: "Amount Due",
      accessor: "amountDue",
    },
    {
      header: "Amount Paid",
      accessor: "amountPaid",
    },
    {
      header: "Balance",
      accessor: "balance",
    },
    {
      header: "Status",
      accessor: "status",
    },
    {
      header: "Last Payment",
      accessor: "lastPayment",
    },
    ...(role === "admin" ? [
      {
        header: "Actions",
        accessor: "action",
      }
    ] : []),
  ];

  return (
    <div className="bg-white p-4 rounded-lg">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800 mb-2">
            Student Payments - {classFee.feeType.name}
          </h1>
          <div className="text-gray-600">
            {classFee.class ? (
              <p className="mb-1">Class: {classFee.class.name}</p>
            ) : (
              <p className="mb-1">Fee Type: Individual/Group Fee</p>
            )}
            {classFee.description && (
              <p className="mb-1">Description: {classFee.description}</p>
            )}
            <p className="mb-1">
              Total Fee Amount: GH₵{classFee.amount.toFixed(2)}
            </p>
            <p>
              Due Date: {new Date(classFee.dueDate).toLocaleDateString()}
            </p>
          </div>
        </div>
        {role === "admin" && (
          <div>
            <FormModal
              table="studentFee"
              type="create"
              data={{
                classFeeId: classFee.id,
                remainingAmount: classFee.amount,
              }}
            />
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mb-4">
        <TableSearch />
      </div>

      <div className="overflow-x-auto mt-6">
        <table className="min-w-full text-sm">
          <thead>
            <tr>
              {columns.map((column) => (
                <th
                  key={column.accessor}
                  className="border-b border-gray-200 bg-gray-50 px-5 py-3 text-left"
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {students.map((student) => {
              const paid = student.studentFees.reduce(
                (sum, fee) => sum + fee.amount,
                0
              );
              const balance = classFee.amount - paid;
              const isPaid = paid >= classFee.amount;
              const isOverdue =
                !isPaid && new Date(classFee.dueDate) < new Date();
              const lastPayment = student.studentFees[0]?.paidDate;

              return (
                <tr key={student.id} className="hover:bg-gray-50">
                  <td className="border-b border-gray-200 px-5 py-3">
                    {student.name} {student.surname}
                  </td>                  <td className="border-b border-gray-200 px-5 py-3">
                    GH₵{classFee.amount.toFixed(2)}
                  </td>
                  <td className="border-b border-gray-200 px-5 py-3">
                    GH₵{paid.toFixed(2)}
                  </td>
                  <td className="border-b border-gray-200 px-5 py-3">
                    ${balance.toFixed(2)}
                  </td>
                  <td className="border-b border-gray-200 px-5 py-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        isPaid
                          ? "bg-green-100 text-green-800"
                          : isOverdue
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {isPaid ? "PAID" : isOverdue ? "OVERDUE" : "PENDING"}
                    </span>
                  </td>
                  <td className="border-b border-gray-200 px-5 py-3">
                    {lastPayment
                      ? new Date(lastPayment).toLocaleDateString()
                      : "No payments"}
                  </td>
                  {role === "admin" && (
                    <td className="border-b border-gray-200 px-5 py-3">
                      <div className="flex items-center gap-2">
                        {!isPaid && (
                          <FormModal
                            table="studentFee"
                            type="create"
                            data={{
                              studentId: student.id,
                              classFeeId: classFee.id,
                              remainingAmount: balance,
                            }}
                          />
                        )}
                        <Link
                          href={`/fees/history/${student.id}`}
                          className="text-lamaPurple hover:underline flex items-center gap-1"
                        >
                          <Image src="/view.png" alt="" width={18} height={18} />
                          <span>Payment History</span>
                        </Link>
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-8">
        <Pagination count={count} page={page} />
      </div>
    </div>
  );
};

export default PaymentDetails;
