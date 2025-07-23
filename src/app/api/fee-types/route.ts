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

    const feeTypes = await prisma.feeType.findMany({
      where: {
        schoolId: schoolFilter.schoolId,
      },
      orderBy: {
        name: "asc",
      },
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

export async function POST(req: Request) {
  try {
    // Get school filter for current user
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

    if (!name) {
      return NextResponse.json(
        { message: "Fee type name is required" },
        { status: 400 }
      );
    }

    // Check if fee type with this name already exists in this school
    const existingFeeType = await prisma.feeType.findFirst({
      where: {
        name,
        schoolId: schoolFilter.schoolId
      }
    });

    if (existingFeeType) {
      return NextResponse.json(
        { message: `A fee type named "${name}" already exists in your school` },
        { status: 400 }
      );
    }

    const feeType = await prisma.feeType.create({
      data: {
        name,
        description,
        school: {
          connect: { id: schoolFilter.schoolId },
        },
      },
    });

    return NextResponse.json(feeType);
  } catch (error: any) {
    console.error("Error creating fee type:", error);
    
    // Check for unique constraint violation
    if (error.code === 'P2002') {
      return NextResponse.json(
        { message: "A fee type with this name already exists in your school" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: "Error creating fee type" },
      { status: 500 }
    );
  }
}