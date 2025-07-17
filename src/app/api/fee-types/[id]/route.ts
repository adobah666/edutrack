import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

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
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;

    const feeType = await prisma.feeType.update({
      where: { id: parseInt(params.id) },
      data: {
        name,
        description,
      },
    });

    return NextResponse.json(feeType);
  } catch (error) {
    console.error("Error updating fee type:", error);
    return NextResponse.json(
      { message: "Error updating fee type" },
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

    await prisma.feeType.delete({
      where: { id: parseInt(params.id) },
    });

    return NextResponse.json({ message: "Fee type deleted" });
  } catch (error) {
    console.error("Error deleting fee type:", error);
    return NextResponse.json(
      { message: "Error deleting fee type" },
      { status: 500 }
    );
  }
}
