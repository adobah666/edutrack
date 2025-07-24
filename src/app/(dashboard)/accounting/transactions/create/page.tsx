import TransactionForm from "@/components/forms/TransactionForm";
import prisma from "@/lib/prisma";
import { getSchoolFilter } from "@/lib/school-context";
import { redirect } from "next/navigation";

const CreateTransactionPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const schoolFilter = await getSchoolFilter();
  const { type } = searchParams;

  // Get accounts for the form
  const accounts = await prisma.account.findMany({
    where: {
      ...(schoolFilter.schoolId ? { schoolId: schoolFilter.schoolId } : {}),
      isActive: true,
    },
    select: { id: true, code: true, name: true, type: true },
    orderBy: { code: "asc" },
  });

  // Generate a reference number
  const transactionCount = await prisma.transaction.count({
    where: schoolFilter.schoolId ? { schoolId: schoolFilter.schoolId } : {},
  });
  
  const referenceNumber = `TXN-${new Date().getFullYear()}-${String(transactionCount + 1).padStart(4, '0')}`;

  const defaultData = {
    reference: referenceNumber,
    type: type?.toUpperCase() || "INCOME",
    date: new Date().toISOString().split('T')[0],
  };

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-semibold">
          {type === "income" ? "Record Income" : 
           type === "expense" ? "Record Expense" : 
           "Create Transaction"}
        </h1>
      </div>
      
      <TransactionForm
        type="create"
        data={defaultData}
        relatedData={{ accounts }}
      />
    </div>
  );
};

export default CreateTransactionPage;