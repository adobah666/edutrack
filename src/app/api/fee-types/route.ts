import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

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
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;

    const feeType = await prisma.feeType.create({
      data: {
        name,
        description,
      },
    });

    return NextResponse.json(feeType);
  } catch (error) {
    console.error("Error creating fee type:", error);
    return NextResponse.json(
      { message: "Error creating fee type" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const feeTypes = await prisma.feeType.findMany({
      orderBy: { name: "asc" },
    });

    return NextResponse.json(feeTypes);
  } catch (error) {
    console.error("Error fetching fee types:", error);
    return NextResponse.json(
      { message: "Error fetching fee types" },
      { status: 500 }
    );
  }
}
