import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { getSchoolFilter } from "@/lib/school-context";

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

    // Get school filter for current user
    const schoolFilter = await getSchoolFilter();
    
    if (!schoolFilter.schoolId) {
      return NextResponse.json(
        { message: "School context not found" },
        { status: 400 }
      );
    }

    const formData = await req.formData();
    const amount = parseFloat(formData.get("amount") as string);
    const dueDate = new Date(formData.get("dueDate") as string);
    const feeTypeId = parseInt(formData.get("feeTypeId") as string);
    const feeScope = (formData.get("feeScope") as string) || "CLASS_WIDE";
    const description = formData.get("description") as string;
    
    let classFee;

    if (feeScope === "CLASS_WIDE") {
      // Class-wide fee (existing logic)
      const classId = parseInt(formData.get("classId") as string);
      
      // Get all students currently in the class
      const studentsInClass = await prisma.student.findMany({
        where: {
          classId: classId,
          schoolId: schoolFilter.schoolId,
        },
        select: {
          id: true,
        },
      });

      classFee = await prisma.classFee.create({
        data: {
          amount,
          dueDate,
          classId,
          feeTypeId,
          schoolId: schoolFilter.schoolId,
          feeScope: "CLASS_WIDE",
          description,
          eligibleStudents: {
            create: studentsInClass.map(student => ({
              studentId: student.id,
            })),
          },
        },
        include: {
          class: true,
          feeType: true,
          eligibleStudents: {
            include: {
              student: {
                select: {
                  id: true,
                  name: true,
                  surname: true,
                },
              },
            },
          },
        },
      });
    } else {
      // Individual fee
      const selectedStudentIds = formData.get("selectedStudents") as string;
      const studentIds = selectedStudentIds ? JSON.parse(selectedStudentIds) : [];

      if (!studentIds || studentIds.length === 0) {
        return NextResponse.json(
          { message: "No students selected for individual fee" },
          { status: 400 }
        );
      }

      // Verify all students belong to the school
      const validStudents = await prisma.student.findMany({
        where: {
          id: { in: studentIds },
          schoolId: schoolFilter.schoolId,
        },
        select: {
          id: true,
        },
      });

      if (validStudents.length !== studentIds.length) {
        return NextResponse.json(
          { message: "Some selected students are invalid" },
          { status: 400 }
        );
      }

      classFee = await prisma.classFee.create({
        data: {
          amount,
          dueDate,
          classId: null, // No specific class for individual fees
          feeTypeId,
          schoolId: schoolFilter.schoolId,
          feeScope: "INDIVIDUAL",
          description,
          eligibleStudents: {
            create: studentIds.map((studentId: string) => ({
              studentId: studentId,
            })),
          },
        },
        include: {
          feeType: true,
          eligibleStudents: {
            include: {
              student: {
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
              },
            },
          },
        },
      });
    }

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
    // Get school filter for current user
    const schoolFilter = await getSchoolFilter();

    const classFees = await prisma.classFee.findMany({
      where: schoolFilter.schoolId ? {
        schoolId: schoolFilter.schoolId
      } : {},
      include: {
        class: true,
        feeType: true,
        studentFees: true,
        eligibleStudents: {
          include: {
            student: {
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
            },
          },
        },
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
