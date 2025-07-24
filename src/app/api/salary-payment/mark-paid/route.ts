import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUserSchool } from "@/lib/school-context";
import { recordSalaryPaymentTransaction } from "@/lib/accounting-integration";

export async function POST(request: NextRequest) {
  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Payment ID is required" },
        { status: 400 }
      );
    }

    // Get user context for school filtering
    const userContext = await getCurrentUserSchool();

    if (!userContext.schoolId) {
      return NextResponse.json(
        { success: false, message: "School context not found" },
        { status: 403 }
      );
    }

    // Update the payment to mark as paid and get related data
    const updatedPayment = await prisma.salaryPayment.update({
      where: {
        id: parseInt(id),
        schoolId: userContext.schoolId, // Ensure user can only update payments from their school
      },
      data: {
        status: "PAID",
        payDate: new Date(), // Set pay date to current date
      },
      include: {
        salary: {
          include: {
            teacher: {
              select: {
                name: true,
                surname: true,
              },
            },
          },
        },
      },
    });

    // Record the payment in the accounting system
    const payPeriod = `${new Intl.DateTimeFormat("en-GB").format(updatedPayment.payPeriodStart)} - ${new Intl.DateTimeFormat("en-GB").format(updatedPayment.payPeriodEnd)}`;
    await recordSalaryPaymentTransaction(
      updatedPayment.id,
      updatedPayment.amount,
      `${updatedPayment.salary.teacher.name} ${updatedPayment.salary.teacher.surname}`,
      payPeriod
    );

    return NextResponse.json({ 
      success: true, 
      message: "Payment marked as paid successfully",
      payment: updatedPayment 
    });

  } catch (error) {
    console.error("Mark payment as paid error:", error);
    
    // Handle specific Prisma errors
    if (error instanceof Error && error.message.includes("Record to update not found")) {
      return NextResponse.json(
        { success: false, message: "Payment record not found or access denied" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}