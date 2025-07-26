import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';
import { getSchoolFilter } from '@/lib/school-context';

export async function POST(request: Request) {
  try {
    const { userId, sessionClaims } = auth();
    const role = (sessionClaims?.metadata as { role?: string })?.role;

    if (!userId || !role) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Only admins and teachers can update subject weights
    if (!['admin', 'teacher'].includes(role)) {
      return NextResponse.json(
        { error: 'Not authorized to update subject weights' },
        { status: 403 }
      );
    }

    const { subjectId, assignmentWeight, examWeight } = await request.json();

    // Validate input
    if (!subjectId || assignmentWeight === undefined || examWeight === undefined) {
      return NextResponse.json(
        { error: 'Subject ID, assignment weight, and exam weight are required' },
        { status: 400 }
      );
    }

    // Validate that weights sum to 1.0 (100%)
    const total = assignmentWeight + examWeight;
    if (Math.abs(total - 1.0) > 0.01) {
      return NextResponse.json(
        { error: 'Assignment and exam weights must sum to 100%' },
        { status: 400 }
      );
    }

    // Validate weight ranges
    if (assignmentWeight < 0 || assignmentWeight > 1 || examWeight < 0 || examWeight > 1) {
      return NextResponse.json(
        { error: 'Weights must be between 0 and 1' },
        { status: 400 }
      );
    }

    // Get school filter for current user
    const schoolFilter = await getSchoolFilter();

    // Verify the subject belongs to the user's school
    const subject = await prisma.subject.findFirst({
      where: {
        id: parseInt(subjectId),
        ...(schoolFilter.schoolId ? { schoolId: schoolFilter.schoolId } : {}),
      },
    });

    if (!subject) {
      return NextResponse.json(
        { error: 'Subject not found or not accessible' },
        { status: 404 }
      );
    }

    // For teachers, verify they are assigned to this subject
    if (role === 'teacher') {
      const teacherSubject = await prisma.subject.findFirst({
        where: {
          id: parseInt(subjectId),
          teachers: {
            some: {
              id: userId,
            },
          },
        },
      });

      if (!teacherSubject) {
        return NextResponse.json(
          { error: 'You are not authorized to modify this subject' },
          { status: 403 }
        );
      }
    }

    // Update the subject weights
    const updatedSubject = await prisma.subject.update({
      where: {
        id: parseInt(subjectId),
      },
      data: {
        assignmentWeight: parseFloat(assignmentWeight),
        examWeight: parseFloat(examWeight),
      },
    });

    return NextResponse.json({
      success: true,
      subject: {
        id: updatedSubject.id,
        name: updatedSubject.name,
        assignmentWeight: updatedSubject.assignmentWeight,
        examWeight: updatedSubject.examWeight,
      },
    });

  } catch (error) {
    console.error('Error updating subject weights:', error);
    return NextResponse.json(
      { error: 'Failed to update subject weights' },
      { status: 500 }
    );
  }
}