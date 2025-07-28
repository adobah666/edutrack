import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSchoolFilter } from "@/lib/school-context";

export async function GET() {
  try {
    const schoolFilter = await getSchoolFilter();
    
    if (!schoolFilter.schoolId) {
      return NextResponse.json(
        { message: "School context not found" },
        { status: 400 }
      );
    }

    const school = await prisma.school.findUnique({
      where: {
        id: schoolFilter.schoolId,
      },
      select: {
        id: true,
        name: true,
        address: true,
        phone: true,
        email: true,
        logo: true,
        openingTime: true,
        closingTime: true,
      },
    });

    if (!school) {
      return NextResponse.json(
        { message: "School not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(school);
  } catch (error) {
    console.error("Error fetching school:", error);
    return NextResponse.json(
      { message: "Error fetching school information" },
      { status: 500 }
    );
  }
}