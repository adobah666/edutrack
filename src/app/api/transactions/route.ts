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

    // Get query parameters for filtering
    const { searchParams } = new URL(req.url);
    const accountId = searchParams.get('accountId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build where clause
    const whereClause: any = {
      schoolId: schoolFilter.schoolId,
    };

    // Add account filter if provided
    if (accountId) {
      whereClause.accountId = parseInt(accountId);
    }

    // Add date range filter if provided
    if (startDate && endDate) {
      whereClause.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const transactions = await prisma.transaction.findMany({
      where: whereClause,
      include: {
        mainAccount: {
          select: {
            id: true,
            name: true,
            code: true,
            type: true,
          },
        },
      },
      orderBy: {
        date: "desc",
      },
    });

    return NextResponse.json(transactions);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json(
      { message: "Error fetching transactions" },
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
    const accountId = parseInt(formData.get("accountId") as string);
    const type = formData.get("type") as string;
    const amount = parseFloat(formData.get("amount") as string);
    const description = formData.get("description") as string;
    const date = formData.get("date") as string;

    if (!accountId || !type || !amount || !description || !date) {
      return NextResponse.json(
        { message: "All fields are required" },
        { status: 400 }
      );
    }

    if (!["INCOME", "EXPENSE"].includes(type)) {
      return NextResponse.json(
        { message: "Type must be INCOME or EXPENSE" },
        { status: 400 }
      );
    }

    // Verify the account exists and belongs to the school
    const account = await prisma.account.findFirst({
      where: {
        id: accountId,
        schoolId: schoolFilter.schoolId,
        isActive: true,
      },
    });

    if (!account) {
      return NextResponse.json(
        { message: "Account not found or inactive" },
        { status: 404 }
      );
    }

    // Generate a reference number
    const reference = `TXN-${Date.now()}`;

    const transaction = await prisma.transaction.create({
      data: {
        reference,
        description,
        amount,
        type,
        date: new Date(date),
        accountId,
        schoolId: schoolFilter.schoolId,
      },
      include: {
        mainAccount: {
          select: {
            id: true,
            name: true,
            code: true,
            type: true,
          },
        },
      },
    });

    return NextResponse.json(transaction);
  } catch (error: any) {
    console.error("Error creating transaction:", error);
    return NextResponse.json(
      { message: "Error creating transaction" },
      { status: 500 }
    );
  }
}