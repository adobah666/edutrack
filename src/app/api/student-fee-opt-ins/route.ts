import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSchoolFilter } from "@/lib/school-context";
import { auth } from "@clerk/nextjs/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId");
    const classId = searchParams.get("classId");

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

    if (studentId) {
      whereClause.studentId = studentId;
    }

    if (classId) {
      whereClause.classId = parseInt(classId);
    }

    const optIns = await prisma.studentFeeOptIn.findMany({
      where: whereClause,
      include: {
        student: {
          select: { id: true, name: true, surname: true }
        },
        feeType: {
          select: { id: true, name: true, description: true }
        },
        class: {
          select: { id: true, name: true }
        }
      },
      orderBy: { optedInAt: 'desc' }
    });

    return NextResponse.json(optIns);
  } catch (error) {
    console.error("Error fetching student fee opt-ins:", error);
    return NextResponse.json(
      { message: "Error fetching student fee opt-ins" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = auth();
    const schoolFilter = await getSchoolFilter();
    
    if (!schoolFilter.schoolId) {
      return NextResponse.json(
        { message: "School context not found" },
        { status: 400 }
      );
    }

    const { studentId, feeTypeId, classId } = await req.json();

    if (!studentId || !feeTypeId || !classId) {
      return NextResponse.json(
        { message: "Student ID, Fee Type ID, and Class ID are required" },
        { status: 400 }
      );
    }

    // Verify the fee type is optional
    const feeType = await prisma.feeType.findFirst({
      where: {
        id: feeTypeId,
        schoolId: schoolFilter.schoolId,
        isOptional: true
      }
    });

    if (!feeType) {
      return NextResponse.json(
        { message: "Fee type not found or is not optional" },
        { status: 404 }
      );
    }

    // Verify the student exists and belongs to the school
    const student = await prisma.student.findFirst({
      where: {
        id: studentId,
        schoolId: schoolFilter.schoolId
      }
    });

    if (!student) {
      return NextResponse.json(
        { message: "Student not found" },
        { status: 404 }
      );
    }

    // Check if already opted in
    const existingOptIn = await prisma.studentFeeOptIn.findUnique({
      where: {
        studentId_feeTypeId_classId: {
          studentId,
          feeTypeId,
          classId
        }
      }
    });

    if (existingOptIn) {
      return NextResponse.json(
        { message: "Student has already opted in to this fee" },
        { status: 400 }
      );
    }

    // Create the opt-in record
    const optIn = await prisma.studentFeeOptIn.create({
      data: {
        studentId,
        feeTypeId,
        classId,
        optedInBy: userId,
        schoolId: schoolFilter.schoolId
      },
      include: {
        student: {
          select: { id: true, name: true, surname: true }
        },
        feeType: {
          select: { id: true, name: true, description: true }
        },
        class: {
          select: { id: true, name: true }
        }
      }
    });

    return NextResponse.json(optIn);
  } catch (error: any) {
    console.error("Error creating student fee opt-in:", error);
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { message: "Student has already opted in to this fee" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: "Error creating student fee opt-in" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId");
    const feeTypeId = searchParams.get("feeTypeId");
    const classId = searchParams.get("classId");

    const schoolFilter = await getSchoolFilter();
    if (!schoolFilter.schoolId) {
      return NextResponse.json(
        { message: "School context not found" },
        { status: 400 }
      );
    }

    if (!studentId || !feeTypeId || !classId) {
      return NextResponse.json(
        { message: "Student ID, Fee Type ID, and Class ID are required" },
        { status: 400 }
      );
    }

    // Find and delete the opt-in record
    const optIn = await prisma.studentFeeOptIn.findUnique({
      where: {
        studentId_feeTypeId_classId: {
          studentId,
          feeTypeId: parseInt(feeTypeId),
          classId: parseInt(classId)
        }
      }
    });

    if (!optIn) {
      return NextResponse.json(
        { message: "Opt-in record not found" },
        { status: 404 }
      );
    }

    await prisma.studentFeeOptIn.delete({
      where: {
        studentId_feeTypeId_classId: {
          studentId,
          feeTypeId: parseInt(feeTypeId),
          classId: parseInt(classId)
        }
      }
    });

    return NextResponse.json({ message: "Successfully opted out of fee" });
  } catch (error) {
    console.error("Error removing student fee opt-in:", error);
    return NextResponse.json(
      { message: "Error removing student fee opt-in" },
      { status: 500 }
    );
  }
}