import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';
import { getSchoolFilter } from '@/lib/school-context';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId, sessionClaims } = auth();
    const role = (sessionClaims?.metadata as { role?: string })?.role;

    if (!userId || !role) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Only admins and teachers can view eligible students
    if (!['admin', 'teacher'].includes(role)) {
      return NextResponse.json(
        { error: 'Not authorized to view eligible students' },
        { status: 403 }
      );
    }

    const examId = parseInt(params.id);
    if (isNaN(examId)) {
      return NextResponse.json(
        { error: 'Invalid exam ID' },
        { status: 400 }
      );
    }

    // Get school filter for current user
    const schoolFilter = await getSchoolFilter();

    // Verify the exam exists and belongs to the user's school
    const exam = await prisma.exam.findFirst({
      where: {
        id: examId,
        ...(schoolFilter.schoolId ? { schoolId: schoolFilter.schoolId } : {}),
      },
      include: {
        examClasses: {
          include: {
            class: true,
          },
        },
      },
    });

    if (!exam) {
      return NextResponse.json(
        { error: 'Exam not found or not accessible' },
        { status: 404 }
      );
    }

    // For teachers, verify they are assigned to the subject of this exam
    if (role === 'teacher') {
      const teacherExam = await prisma.exam.findFirst({
        where: {
          id: examId,
          subject: {
            teachers: {
              some: {
                id: userId,
              },
            },
          },
        },
      });

      if (!teacherExam) {
        return NextResponse.json(
          { error: 'You are not authorized to view this exam' },
          { status: 403 }
        );
      }
    }

    // Get eligible students for this exam
    const eligibleStudents = await prisma.examEligibleStudent.findMany({
      where: {
        examId: examId,
      },
      select: {
        studentId: true,
        student: {
          select: {
            id: true,
            name: true,
            surname: true,
          },
        },
      },
      orderBy: {
        student: {
          name: 'asc',
        },
      },
    });

    // Transform the data for the response
    const eligibleStudentData = eligibleStudents.map(eligibility => ({
      studentId: eligibility.studentId,
      name: eligibility.student.name,
      surname: eligibility.student.surname,
    }));

    return NextResponse.json(eligibleStudentData);

  } catch (error) {
    console.error('Error fetching eligible students:', error);
    return NextResponse.json(
      { error: 'Failed to fetch eligible students' },
      { status: 500 }
    );
  }
}