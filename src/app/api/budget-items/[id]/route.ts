import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSchoolFilter } from "@/lib/school-context";

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const schoolFilter = await getSchoolFilter();
    if (!schoolFilter.schoolId) {
      return NextResponse.json(
        { message: "School context not found" },
        { status: 400 }
      );
    }

    const itemId = parseInt(params.id);
    const formData = await req.formData();
    const budgetedAmount = parseFloat(formData.get("budgetedAmount") as string);
    const description = formData.get("description") as string;

    if (!budgetedAmount) {
      return NextResponse.json(
        { message: "Budgeted amount is required" },
        { status: 400 }
      );
    }

    // Check if budget item exists and belongs to school
    const existingItem = await prisma.budgetItem.findFirst({
      where: {
        id: itemId,
        schoolId: schoolFilter.schoolId,
      },
    });

    if (!existingItem) {
      return NextResponse.json(
        { message: "Budget item not found" },
        { status: 404 }
      );
    }

    const updatedItem = await prisma.budgetItem.update({
      where: { id: itemId },
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
    await updateBudgetTotal(existingItem.budgetId);

    return NextResponse.json(updatedItem);
  } catch (error: any) {
    console.error("Error updating budget item:", error);
    return NextResponse.json(
      { message: "Error updating budget item" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const schoolFilter = await getSchoolFilter();
    if (!schoolFilter.schoolId) {
      return NextResponse.json(
        { message: "School context not found" },
        { status: 400 }
      );
    }

    const itemId = parseInt(params.id);

    // Check if budget item exists and belongs to school
    const existingItem = await prisma.budgetItem.findFirst({
      where: {
        id: itemId,
        schoolId: schoolFilter.schoolId,
      },
    });

    if (!existingItem) {
      return NextResponse.json(
        { message: "Budget item not found" },
        { status: 404 }
      );
    }

    const budgetId = existingItem.budgetId;

    // Delete budget item
    await prisma.budgetItem.delete({
      where: { id: itemId },
    });

    // Update budget total
    await updateBudgetTotal(budgetId);

    return NextResponse.json({ message: "Budget item deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting budget item:", error);
    return NextResponse.json(
      { message: "Error deleting budget item" },
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