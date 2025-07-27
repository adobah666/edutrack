import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';
import { getSchoolFilter } from '@/lib/school-context';

// GET - Fetch all grading schemes for the current school
export async function GET() {
  try {
    const { userId, sessionClaims } = auth();
    const role = (sessionClaims?.metadata as { role?: string })?.role;

    if (!userId || !role) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
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

    // Fetch grading schemes for this school
    const schemes = await prisma.gradingScheme.findMany({
      where: {
        schoolId: schoolFilter.schoolId,
      },
      include: {
        grades: {
          orderBy: {
            order: 'asc',
          },
        },
      },
      orderBy: [
        { isDefault: 'desc' }, // Default schemes first
        { name: 'asc' },
      ],
    });

    return NextResponse.json(schemes);

  } catch (error) {
    console.error('Error fetching grading schemes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch grading schemes' },
      { status: 500 }
    );
  }
}

// POST - Create a new grading scheme
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

    // Only admins and teachers can create grading schemes
    if (!['admin', 'teacher'].includes(role)) {
      return NextResponse.json(
        { error: 'Not authorized to create grading schemes' },
        { status: 403 }
      );
    }

    const { name, description, isDefault, grades } = await request.json();

    // Validate input
    if (!name || !grades || grades.length === 0) {
      return NextResponse.json(
        { error: 'Name and grades are required' },
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

    // If this is being set as default, unset other defaults
    if (isDefault) {
      await prisma.gradingScheme.updateMany({
        where: {
          schoolId: schoolFilter.schoolId,
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      });
    }

    // Create the grading scheme with grades
    const scheme = await prisma.gradingScheme.create({
      data: {
        name,
        description: description || null,
        schoolId: schoolFilter.schoolId,
        isDefault: isDefault || false,
        createdBy: userId,
        grades: {
          create: grades.map((grade: any) => ({
            grade: grade.grade,
            minPercentage: parseFloat(grade.minPercentage),
            maxPercentage: parseFloat(grade.maxPercentage),
            description: grade.description || null,
            color: grade.color || null,
            order: parseInt(grade.order),
          })),
        },
      },
      include: {
        grades: {
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    return NextResponse.json(scheme);

  } catch (error) {
    console.error('Error creating grading scheme:', error);
    return NextResponse.json(
      { error: 'Failed to create grading scheme' },
      { status: 500 }
    );
  }
}

// PUT - Update an existing grading scheme
export async function PUT(request: Request) {
  try {
    const { userId, sessionClaims } = auth();
    const role = (sessionClaims?.metadata as { role?: string })?.role;

    if (!userId || !role) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Only admins and teachers can update grading schemes
    if (!['admin', 'teacher'].includes(role)) {
      return NextResponse.json(
        { error: 'Not authorized to update grading schemes' },
        { status: 403 }
      );
    }

    const { id, name, description, isDefault, grades } = await request.json();

    if (!id || !name || !grades || grades.length === 0) {
      return NextResponse.json(
        { error: 'ID, name, and grades are required' },
        { status: 400 }
      );
    }

    // Get school filter for current user
    const schoolFilter = await getSchoolFilter();

    // Verify the scheme belongs to the user's school
    const existingScheme = await prisma.gradingScheme.findFirst({
      where: {
        id: parseInt(id),
        ...(schoolFilter.schoolId && { schoolId: schoolFilter.schoolId }),
      },
    });

    if (!existingScheme) {
      return NextResponse.json(
        { error: 'Grading scheme not found or not accessible' },
        { status: 404 }
      );
    }

    // If this is being set as default, unset other defaults
    if (isDefault && !existingScheme.isDefault) {
      await prisma.gradingScheme.updateMany({
        where: {
          ...(schoolFilter.schoolId && { schoolId: schoolFilter.schoolId }),
          isDefault: true,
          id: { not: parseInt(id) },
        },
        data: {
          isDefault: false,
        },
      });
    }

    // Update the scheme and replace all grades
    const updatedScheme = await prisma.$transaction(async (tx) => {
      // Delete existing grades
      await tx.gradeScale.deleteMany({
        where: {
          gradingSchemeId: parseInt(id),
        },
      });

      // Update the scheme and create new grades
      return await tx.gradingScheme.update({
        where: {
          id: parseInt(id),
        },
        data: {
          name,
          description: description || null,
          isDefault: isDefault || false,
          grades: {
            create: grades.map((grade: any) => ({
              grade: grade.grade,
              minPercentage: parseFloat(grade.minPercentage),
              maxPercentage: parseFloat(grade.maxPercentage),
              description: grade.description || null,
              color: grade.color || null,
              order: parseInt(grade.order),
            })),
          },
        },
        include: {
          grades: {
            orderBy: {
              order: 'asc',
            },
          },
        },
      });
    });

    return NextResponse.json(updatedScheme);

  } catch (error) {
    console.error('Error updating grading scheme:', error);
    return NextResponse.json(
      { error: 'Failed to update grading scheme' },
      { status: 500 }
    );
  }
}