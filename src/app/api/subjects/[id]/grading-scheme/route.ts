import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';
import { getSchoolFilter } from '@/lib/school-context';

// POST - Assign a grading scheme to a subject
export async function POST(
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

    // Only admins and teachers can assign grading schemes
    if (!['admin', 'teacher'].includes(role)) {
      return NextResponse.json(
        { error: 'Not authorized to assign grading schemes' },
        { status: 403 }
      );
    }

    const subjectId = parseInt(params.id);
    if (isNaN(subjectId)) {
      return NextResponse.json(
        { error: 'Invalid subject ID' },
        { status: 400 }
      );
    }

    const { gradingSchemeId } = await request.json();

    // Get school filter for current user
    const schoolFilter = await getSchoolFilter();

    // Verify the subject belongs to the user's school
    const subject = await prisma.subject.findFirst({
      where: {
        id: subjectId,
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
          id: subjectId,
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

    // If gradingSchemeId is provided, verify it exists and belongs to the same school
    if (gradingSchemeId) {
      const scheme = await prisma.gradingScheme.findFirst({
        where: {
          id: parseInt(gradingSchemeId),
          ...(schoolFilter.schoolId && { schoolId: schoolFilter.schoolId }),
        },
      });

      if (!scheme) {
        return NextResponse.json(
          { error: 'Grading scheme not found or not accessible' },
          { status: 404 }
        );
      }
    }

    // Update the subject's grading scheme
    const updatedSubject = await prisma.subject.update({
      where: {
        id: subjectId,
      },
      data: {
        gradingSchemeId: gradingSchemeId ? parseInt(gradingSchemeId) : null,
      },
      include: {
        gradingScheme: {
          include: {
            grades: {
              orderBy: {
                order: 'asc',
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      subject: updatedSubject,
    });

  } catch (error) {
    console.error('Error assigning grading scheme:', error);
    return NextResponse.json(
      { error: 'Failed to assign grading scheme' },
      { status: 500 }
    );
  }
}