import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSchoolFilter } from "@/lib/school-context";

export async function POST(req: Request) {
  try {
    const schoolFilter = await getSchoolFilter();
    if (!schoolFilter.schoolId) {
      return NextResponse.json(
        { message: "School context not found" },
        { status: 400 }
      );
    }

    const formData = await req.formData();
    const budgetId = parseInt(formData.get("budgetId") as string);
    const accountId = parseInt(formData.get("accountId") as string);
    const budgetedAmount = parseFloat(formData.get("budgetedAmount") as string);
    const description = formData.get("description") as string;

    if (!budgetId || !accountId || !budgetedAmount) {
      return NextResponse.json(
        { message: "Budget ID, Account ID, and budgeted amount are required" },
        { status: 400 }
      );
    }

    // Check if budget item already exists for this budget and account
    const existingItem = await prisma.budgetItem.findFirst({
      where: {
        budgetId,
        accountId,
        schoolId: schoolFilter.schoolId,
      },
    });

    if (existingItem) {
      // Update existing item
      const updatedItem = await prisma.budgetItem.update({
        where: { id: existingItem.id },
        data: {
          budgetedAmount,
          description,
        },
        include: {
          account: {
            select: {
              id: true,
              name: true,
              code: true,
              type: true,
            },
          },
        },
      });

      // Update budget total
      await updateBudgetTotal(budgetId);

      return NextResponse.json(updatedItem);
    } else {
      // Create new item
      const budgetItem = await prisma.budgetItem.create({
        data: {
          budgetId,
          accountId,
          budgetedAmount,
          description,
          schoolId: schoolFilter.schoolId,
        },
        include: {
          account: {
            select: {
              id: true,
              name: true,
              code: true,
              type: true,
            },
          },
        },
      });

      // Update budget total
      await updateBudgetTotal(budgetId);

      return NextResponse.json(budgetItem);
    }
  } catch (error: any) {
    console.error("Error creating/updating budget item:", error);
    return NextResponse.json(
      { message: "Error creating/updating budget item" },
      { status: 500 }
    );
  }
}

async function updateBudgetTotal(budgetId: number) {
  const budgetItems = await prisma.budgetItem.findMany({
    where: { budgetId },
  });

  const totalAmount = budgetItems.reduce((sum, item) => sum + item.budgetedAmount, 0);

  await prisma.budget.update({
    where: { id: budgetId },
    data: { totalAmount },
  });
}