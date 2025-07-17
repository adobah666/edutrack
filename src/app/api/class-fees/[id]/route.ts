import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

// This tells Next.js to always fetch fresh data
export const dynamic = 'force-dynamic'

export async function PUT(
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

    const formData = await req.formData();
    const amount = parseFloat(formData.get("amount") as string);
    const dueDate = new Date(formData.get("dueDate") as string);
    const classId = parseInt(formData.get("classId") as string);
    const feeTypeId = parseInt(formData.get("feeTypeId") as string);

    const classFee = await prisma.classFee.update({
      where: { id: parseInt(params.id) },
      data: {
        amount,
        dueDate,
        classId,
        feeTypeId,
      },
    });

    return NextResponse.json(classFee);
  } catch (error) {
    console.error("Error updating class fee:", error);
    return NextResponse.json(
      { message: "Error updating class fee" },
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

    await prisma.classFee.delete({
      where: { id: parseInt(params.id) },
    });

    return NextResponse.json({ message: "Class fee deleted" });
  } catch (error) {
    console.error("Error deleting class fee:", error);
    return NextResponse.json(
      { message: "Error deleting class fee" },
      { status: 500 }
    );
  }
}

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const classFee = await prisma.classFee.findUnique({
      where: { id: parseInt(params.id) },
      include: {
        class: true,
        feeType: true,
        studentFees: {
          include: {
            student: true,
          },
        },
      },
    });

    if (!classFee) {
      return NextResponse.json(
        { message: "Class fee not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(classFee);
  } catch (error) {
    console.error("Error fetching class fee:", error);
    return NextResponse.json(
      { message: "Error fetching class fee" },
      { status: 500 }
    );
  }
}
