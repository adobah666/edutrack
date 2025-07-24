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

    const budgetId = parseInt(params.id);
    const formData = await req.formData();
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const startDate = formData.get("startDate") as string;
    const endDate = formData.get("endDate") as string;

    if (!name || !startDate || !endDate) {
      return NextResponse.json(
        { message: "Name, start date, and end date are required" },
        { status: 400 }
      );
    }

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

    const budget = await prisma.budget.update({
      where: { id: budgetId },
      data: {
        name,
        description,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      },
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

    return NextResponse.json(budget);
  } catch (error: any) {
    console.error("Error updating budget:", error);
    return NextResponse.json(
      { message: "Error updating budget" },
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

    // Delete budget items first
    await prisma.budgetItem.deleteMany({
      where: { budgetId },
    });

    // Delete budget
    await prisma.budget.delete({
      where: { id: budgetId },
    });

    return NextResponse.json({ message: "Budget deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting budget:", error);
    return NextResponse.json(
      { message: "Error deleting budget" },
      { status: 500 }
    );
  }
}