import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSchoolFilter } from "@/lib/school-context";

export async function POST(
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

    const budgetId = parseInt(params.id);

    // Check if budget exists and belongs to school
    const existingBudget = await prisma.budget.findFirst({
      where: {
        id: budgetId,
        schoolId: schoolFilter.schoolId,
      },
    });

    if (!existingBudget) {
      return NextResponse.json(
        { message: "Budget not found" },
        { status: 404 }
      );
    }

    // Deactivate all other budgets for this school
    await prisma.budget.updateMany({
      where: {
        schoolId: schoolFilter.schoolId,
        id: { not: budgetId },
      },
      data: { isActive: false },
    });

    // Activate the selected budget
    const activatedBudget = await prisma.budget.update({
      where: { id: budgetId },
      data: { isActive: true },
      include: {
        budgetItems: {
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
        },
      },
    });

    return NextResponse.json(activatedBudget);
  } catch (error: any) {
    console.error("Error activating budget:", error);
    return NextResponse.json(
      { message: "Error activating budget" },
      { status: 500 }
    );
  }
}