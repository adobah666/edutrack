import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

// This tells Next.js to always fetch fresh data
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
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

    const classFee = await prisma.classFee.create({
      data: {
        amount,
        dueDate,
        classId,
        feeTypeId,
      },
    });

    return NextResponse.json(classFee);
  } catch (error) {
    console.error("Error creating class fee:", error);
    return NextResponse.json(
      { message: "Error creating class fee" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const classFees = await prisma.classFee.findMany({
      include: {
        class: true,
        feeType: true,
        studentFees: true,
      },
      orderBy: { dueDate: "desc" },
    });

    return NextResponse.json(classFees);
  } catch (error) {
    console.error("Error fetching class fees:", error);
    return NextResponse.json(
      { message: "Error fetching class fees" },
      { status: 500 }
    );
  }
}
