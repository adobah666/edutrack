import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';
import { getSchoolFilter } from '@/lib/school-context';

// GET - Fetch result approvals for a specific term
export async function GET(request: Request) {
  try {
    const { userId, sessionClaims } = auth();
    const role = (sessionClaims?.metadata as { role?: string })?.role;

    if (!userId || !role) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Only admins can view result approvals
    if (role !== 'admin') {
      return NextResponse.json(
        { error: 'Not authorized to view result approvals' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const term = searchParams.get('term');

    if (!term) {
      return NextResponse.json(
        { error: 'Term is required' },
        { status: 400 }
      );
    }

    // Get school filter for current user
    const schoolFilter = await getSchoolFilter();

    if (!schoolFilter.schoolId) {
      return NextResponse.json(
        { error: 'School context not found' },
        { status: 400 }
      );
    }

    // Get all classes for this school
    const classes = await prisma.class.findMany({
      where: {
        schoolId: schoolFilter.schoolId,
      },
      include: {
        grade: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    // Get existing approvals for this term
    const existingApprovals = await prisma.resultApproval.findMany({
      where: {
        schoolId: schoolFilter.schoolId,
        term: term as any,
      },
    });

    // Create approval objects for all classes (with existing approval status if available)
    const approvals = classes.map(classItem => {
      const existingApproval = existingApprovals.find(a => a.classId === classItem.id);
      
      return {
        id: existingApproval?.id || 0,
        classId: classItem.id,
        className: classItem.name,
        gradeName: classItem.grade.name,
        term: term,
        isApproved: existingApproval?.isApproved || false,
        approvedBy: existingApproval?.approvedBy,
        approvedAt: existingApproval?.approvedAt,
        notes: existingApproval?.notes,
      };
    });

    return NextResponse.json(approvals);

  } catch (error) {
    console.error('Error fetching result approvals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch result approvals' },
      { status: 500 }
    );
  }
}

// POST - Create or update result approval
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

    // Only admins can manage result approvals
    if (role !== 'admin') {
      return NextResponse.json(
        { error: 'Not authorized to manage result approvals' },
        { status: 403 }
      );
    }

    const { classId, term, isApproved, notes } = await request.json();

    // Validate input
    if (!classId || !term || typeof isApproved !== 'boolean') {
      return NextResponse.json(
        { error: 'Class ID, term, and approval status are required' },
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

    // Get school filter for current user
    const schoolFilter = await getSchoolFilter();

    if (!schoolFilter.schoolId) {
      return NextResponse.json(
        { error: 'School context not found' },
        { status: 400 }
      );
    }

    // Verify the class belongs to the user's school
    const classItem = await prisma.class.findFirst({
      where: {
        id: parseInt(classId),
        schoolId: schoolFilter.schoolId,
      },
      include: {
        grade: true,
      },
    });

    if (!classItem) {
      return NextResponse.json(
        { error: 'Class not found or not accessible' },
        { status: 404 }
      );
    }

    // Create or update the result approval
    const approval = await prisma.resultApproval.upsert({
      where: {
        classId_term_schoolId: {
          classId: parseInt(classId),
          term: term,
          schoolId: schoolFilter.schoolId,
        },
      },
      update: {
        isApproved: isApproved,
        approvedBy: isApproved ? userId : null,
        approvedAt: isApproved ? new Date() : null,
        notes: notes || null,
        updatedAt: new Date(),
      },
      create: {
        classId: parseInt(classId),
        term: term,
        schoolId: schoolFilter.schoolId,
        isApproved: isApproved,
        approvedBy: isApproved ? userId : null,
        approvedAt: isApproved ? new Date() : null,
        notes: notes || null,
      },
    });

    return NextResponse.json({
      success: true,
      approval: {
        id: approval.id,
        classId: approval.classId,
        className: classItem.name,
        gradeName: classItem.grade.name,
        term: approval.term,
        isApproved: approval.isApproved,
        approvedBy: approval.approvedBy,
        approvedAt: approval.approvedAt,
        notes: approval.notes,
      },
    });

  } catch (error) {
    console.error('Error managing result approval:', error);
    return NextResponse.json(
      { error: 'Failed to manage result approval' },
      { status: 500 }
    );
  }
}