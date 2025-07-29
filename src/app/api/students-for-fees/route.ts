import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { getSchoolFilter } from "@/lib/school-context";

export async function GET(req: Request) {
  try {
    const { userId, sessionClaims } = auth();
    const role = (sessionClaims?.metadata as { role?: string })?.role;

    if (role !== "admin") {
      return NextResponse.json(
        { message: "Not authorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const classId = searchParams.get("classId");

    // Get school filter for current user
    const schoolFilter = await getSchoolFilter();
    
    if (!schoolFilter.schoolId) {
      return NextResponse.json(
        { message: "School context not found" },
        { status: 400 }
      );
    }

    let whereClause: any = {
      schoolId: schoolFilter.schoolId,
    };

    // If classId is provided, filter by class
    if (classId && classId !== "all") {
      whereClause.classId = parseInt(classId);
    }

    const students = await prisma.student.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        surname: true,
        username: true,
        class: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [
        { class: { name: "asc" } },
        { name: "asc" },
        { surname: "asc" },
      ],
    });

    return NextResponse.json(students);
  } catch (error) {
    console.error("Error fetching students for fees:", error);
    return NextResponse.json(
      { message: "Error fetching students" },
      { status: 500 }
    );
  }
}