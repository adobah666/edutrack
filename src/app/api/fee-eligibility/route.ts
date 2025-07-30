import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { getSchoolFilter } from "@/lib/school-context";

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

    const { classFeeId, studentIds } = await req.json();

    if (!classFeeId || !studentIds || !Array.isArray(studentIds)) {
      return NextResponse.json(
        { message: "Class fee ID and student IDs are required" },
        { status: 400 }
      );
    }

    // Get school filter for current user
    const schoolFilter = await getSchoolFilter();

    // Verify the class fee belongs to the admin's school
    const classFee = await prisma.classFee.findFirst({
      where: { 
        id: classFeeId,
        ...(schoolFilter.schoolId ? {
          class: {
            schoolId: schoolFilter.schoolId
          }
        } : {}),
      },
    });

    if (!classFee) {
      return NextResponse.json(
        { message: "Class fee not found" },
        { status: 404 }
      );
    }

    // Verify all students belong to the admin's school
    const students = await prisma.student.findMany({
      where: {
        id: { in: studentIds },
        ...(schoolFilter.schoolId ? { schoolId: schoolFilter.schoolId } : {}),
      },
    });

    if (students.length !== studentIds.length) {
      return NextResponse.json(
        { message: "Some students not found or not in your school" },
        { status: 400 }
      );
    }

    // Create fee eligibility records for the students
    const eligibilityRecords = await prisma.studentFeeEligibility.createMany({
      data: studentIds.map((studentId: string) => ({
        studentId,
        classFeeId,
      })),
      skipDuplicates: true, // Avoid duplicates if student is already eligible
    });

    return NextResponse.json({
      message: `Successfully added ${eligibilityRecords.count} students to fee eligibility`,
      count: eligibilityRecords.count,
    });
  } catch (error) {
    console.error("Error adding students to fee eligibility:", error);
    return NextResponse.json(
      { message: "Error adding students to fee eligibility" },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch students not yet eligible for a specific fee
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
    const classFeeId = searchParams.get("classFeeId");

    if (!classFeeId) {
      return NextResponse.json(
        { message: "Class fee ID is required" },
        { status: 400 }
      );
    }

    // Get school filter for current user
    const schoolFilter = await getSchoolFilter();

    // Get students who are NOT yet eligible for this fee
    const availableStudents = await prisma.student.findMany({
      where: {
        ...(schoolFilter.schoolId ? { schoolId: schoolFilter.schoolId } : {}),
        feeEligibility: {
          none: {
            classFeeId: parseInt(classFeeId),
          },
        },
      },
      select: {
        id: true,
        name: true,
        surname: true,
        class: {
          select: {
            name: true,
          },
        },
      },
      orderBy: [
        { name: 'asc' },
        { surname: 'asc' },
      ],
    });

    return NextResponse.json(availableStudents);
  } catch (error) {
    console.error("Error fetching available students:", error);
    return NextResponse.json(
      { message: "Error fetching available students" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { userId, sessionClaims } = auth();
    const role = (sessionClaims?.metadata as { role?: string })?.role;

    if (role !== "admin") {
      return NextResponse.json(
        { message: "Not authorized" },
        { status: 401 }
      );
    }

    const { classFeeId, studentId } = await req.json();

    if (!classFeeId || !studentId) {
      return NextResponse.json(
        { message: "Class fee ID and student ID are required" },
        { status: 400 }
      );
    }

    // Get school filter for current user
    const schoolFilter = await getSchoolFilter();

    // Verify the class fee belongs to the admin's school
    const classFee = await prisma.classFee.findFirst({
      where: { 
        id: classFeeId,
        ...(schoolFilter.schoolId ? {
          class: {
            schoolId: schoolFilter.schoolId
          }
        } : {}),
      },
    });

    if (!classFee) {
      return NextResponse.json(
        { message: "Class fee not found" },
        { status: 404 }
      );
    }

    // Verify the student belongs to the admin's school
    const student = await prisma.student.findFirst({
      where: {
        id: studentId,
        ...(schoolFilter.schoolId ? { schoolId: schoolFilter.schoolId } : {}),
      },
    });

    if (!student) {
      return NextResponse.json(
        { message: "Student not found or not in your school" },
        { status: 404 }
      );
    }

    // Check if student has any payments for this fee
    const existingPayments = await prisma.studentFee.findMany({
      where: {
        studentId,
        classFeeId,
      },
    });

    if (existingPayments.length > 0) {
      return NextResponse.json(
        { message: "Cannot remove student who has already made payments for this fee" },
        { status: 400 }
      );
    }

    // Remove the student's eligibility for this fee
    await prisma.studentFeeEligibility.deleteMany({
      where: {
        studentId,
        classFeeId,
      },
    });

    return NextResponse.json({
      message: "Student successfully removed from fee eligibility",
    });
  } catch (error) {
    console.error("Error removing student from fee eligibility:", error);
    return NextResponse.json(
      { message: "Error removing student from fee eligibility" },
      { status: 500 }
    );
  }
}