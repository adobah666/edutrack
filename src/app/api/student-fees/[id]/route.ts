import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {  try {
    const payment = await prisma.studentFee.findUnique({
      where: { id: parseInt(params.id) },
      include: {
        student: {
          select: {
            name: true,
            surname: true,
          },
        },
        classFee: {
          include: {
            class: {
              select: {
                name: true,
              },
            },
            feeType: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    if (!payment) {
      return NextResponse.json(
        { message: "Payment not found" },
        { status: 404 }
      );
    }

    // Get all payments for this student and class fee
    const allPayments = await prisma.studentFee.findMany({
      where: {
        studentId: payment.studentId,
        classFeeId: payment.classFeeId,
      },
    });

    // Calculate total paid amount
    const totalPaid = allPayments.reduce((sum, p) => sum + p.amount, 0);

    return NextResponse.json({
      ...payment,
      totalPaidAmount: totalPaid,
    });
  } catch (error) {
    console.error("Error fetching payment:", error);
    return NextResponse.json(
      { message: "Error fetching payment" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId, sessionClaims } = auth();
    const role = (sessionClaims?.metadata as { role?: string })?.role;

    if (role !== "admin") {
      return NextResponse.json(
        { message: "Not authorized" },
        { status: 401 }
      );
    }

    await prisma.studentFee.delete({
      where: { id: parseInt(params.id) },
    });

    return NextResponse.json({ message: "Payment reversed successfully" });
  } catch (error) {
    console.error("Error reversing payment:", error);
    return NextResponse.json(
      { message: "Error reversing payment" },
      { status: 500 }
    );
  }
}
