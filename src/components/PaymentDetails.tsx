import { Class, ClassFee, FeeType, Student, StudentFee } from "@prisma/client";
import { auth } from "@clerk/nextjs/server";
import PaymentDetailsClient from "./PaymentDetailsClient";

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

  return (
    <PaymentDetailsClient
      classFee={classFee}
      students={students}
      count={count}
      page={page}
      role={role}
    />
  );
};

export default PaymentDetails;
