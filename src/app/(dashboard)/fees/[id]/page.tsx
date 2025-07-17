import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import { ITEM_PER_PAGE } from "@/lib/settings";
import PaymentDetails from "@/components/PaymentDetails";

const FeeDetailsPage = async ({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { [key: string]: string | undefined };
}) => {
  const { userId, sessionClaims } = auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  const currentUserId = userId;

  const { page, ...queryParams } = searchParams;
  const p = page ? parseInt(page) : 1;

  // Get the class fee details
  const classFee = await prisma.classFee.findUnique({
    where: { id: parseInt(params.id) },
    include: {
      class: true,
      feeType: true,
    },
  });

  if (!classFee) {
    notFound();
  }

  // Build the query for student fees
  const query: any = {
    classFeeId: parseInt(params.id),
  };

  // Handle search and filters
  if (queryParams.search) {
    query.student = {
      OR: [
        { name: { contains: queryParams.search, mode: "insensitive" } },
        { surname: { contains: queryParams.search, mode: "insensitive" } },
      ],
    };
  }

  // For parents, only show their children's fees
  if (role === "parent") {
    query.student = {
      ...query.student,
      parentId: currentUserId,
    };
  }

  // Get students in the class and their payment status
  const [students, count] = await prisma.$transaction([
    prisma.student.findMany({
      where: {
        classId: classFee.classId,
        ...(role === "parent" ? { parentId: currentUserId } : {}),
      },
      include: {
        studentFees: {
          where: { classFeeId: classFee.id },
        },
      },
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
    }),
    prisma.student.count({
      where: {
        classId: classFee.classId,
        ...(role === "parent" ? { parentId: currentUserId } : {}),
      },
    }),
  ]);

  return (
    <div>
      <PaymentDetails
        classFee={classFee}
        students={students}
        count={count}
        page={p}
      />
    </div>
  );
};

export default FeeDetailsPage;
