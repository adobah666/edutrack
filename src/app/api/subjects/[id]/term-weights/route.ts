import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';
import { getSchoolFilter } from '@/lib/school-context';

// GET - Fetch term weights for a subject
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

    const subjectId = parseInt(params.id);
    if (isNaN(subjectId)) {
      return NextResponse.json(
        { error: 'Invalid subject ID' },
        { status: 400 }
      );
    }

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
          { error: 'You are not authorized to view this subject' },
          { status: 403 }
        );
      }
    }

    // Fetch term weights for this subject
    const termWeights = await prisma.subjectTermWeight.findMany({
      where: {
        subjectId: subjectId,
      },
      orderBy: {
        term: 'asc',
      },
    });

    return NextResponse.json(termWeights);

  } catch (error) {
    console.error('Error fetching term weights:', error);
    return NextResponse.json(
      { error: 'Failed to fetch term weights' },
      { status: 500 }
    );
  }
}

// POST - Create or update term weight for a subject
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

    // Only admins and teachers can update term weights
    if (!['admin', 'teacher'].includes(role)) {
      return NextResponse.json(
        { error: 'Not authorized to update term weights' },
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

    const { term, assignmentWeight, examWeight } = await request.json();

    // Validate input
    if (!term || assignmentWeight === undefined || examWeight === undefined) {
      return NextResponse.json(
        { error: 'Term, assignment weight, and exam weight are required' },
        { status: 400 }
      );
    }

    // Validate term value
    const validTerms = ['FIRST', 'SECOND', 'THIRD', 'FINAL'];
    if (!validTerms.includes(term)) {
      return NextResponse.json(
        { error: 'Invalid term value' },
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

    // Create or update the term weight
    const termWeight = await prisma.subjectTermWeight.upsert({
      where: {
        subjectId_term: {
          subjectId: subjectId,
          term: term,
        },
      },
      update: {
        assignmentWeight: parseFloat(assignmentWeight),
        examWeight: parseFloat(examWeight),
      },
      create: {
        subjectId: subjectId,
        term: term,
        assignmentWeight: parseFloat(assignmentWeight),
        examWeight: parseFloat(examWeight),
      },
    });

    return NextResponse.json(termWeight);

  } catch (error) {
    console.error('Error saving term weight:', error);
    return NextResponse.json(
      { error: 'Failed to save term weight' },
      { status: 500 }
    );
  }
}

// DELETE - Remove term weight for a subject
export async function DELETE(
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

    // Only admins and teachers can delete term weights
    if (!['admin', 'teacher'].includes(role)) {
      return NextResponse.json(
        { error: 'Not authorized to delete term weights' },
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

    const { term } = await request.json();

    if (!term) {
      return NextResponse.json(
        { error: 'Term is required' },
        { status: 400 }
      );
    }

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

    // Delete the term weight
    await prisma.subjectTermWeight.delete({
      where: {
        subjectId_term: {
          subjectId: subjectId,
          term: term,
        },
      },
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error deleting term weight:', error);
    return NextResponse.json(
      { error: 'Failed to delete term weight' },
      { status: 500 }
    );
  }
}