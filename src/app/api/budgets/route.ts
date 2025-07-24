import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSchoolFilter } from "@/lib/school-context";

export async function GET(req: NextRequest) {
  try {
    const schoolFilter = await getSchoolFilter();
    if (!schoolFilter.schoolId) {
      return NextResponse.json(
        { message: "School context not found" },
        { status: 400 }
      );
    }

    const budgets = await prisma.budget.findMany({
      where: {
        schoolId: schoolFilter.schoolId,
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
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(budgets);
  } catch (error) {
    console.error("Error fetching budgets:", error);
    return NextResponse.json(
      { message: "Error fetching budgets" },
      { status: 500 }
    );
  }
}

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

    // Check if budget with this name already exists
    const existingBudget = await prisma.budget.findFirst({
      where: {
        name,
        schoolId: schoolFilter.schoolId,
      },
    });

    if (existingBudget) {
      return NextResponse.json(
        { message: "A budget with this name already exists" },
        { status: 400 }
      );
    }

    const budget = await prisma.budget.create({
      data: {
        name,
        description,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        schoolId: schoolFilter.schoolId,
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
    console.error("Error creating budget:", error);
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { message: "A budget with this name already exists" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: "Error creating budget" },
      { status: 500 }
    );
  }
}