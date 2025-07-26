import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';
import { getSchoolFilter } from '@/lib/school-context';

// DELETE - Delete a grading scheme
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

    // Only admins can delete grading schemes
    if (role !== 'admin') {
      return NextResponse.json(
        { error: 'Not authorized to delete grading schemes' },
        { status: 403 }
      );
    }

    const schemeId = parseInt(params.id);
    if (isNaN(schemeId)) {
      return NextResponse.json(
        { error: 'Invalid scheme ID' },
        { status: 400 }
      );
    }

    // Get school filter for current user
    const schoolFilter = await getSchoolFilter();

    // Verify the scheme belongs to the user's school
    const scheme = await prisma.gradingScheme.findFirst({
      where: {
        id: schemeId,
        schoolId: schoolFilter.schoolId,
      },
      include: {
        subjects: true, // Check if any subjects are using this scheme
      },
    });

    if (!scheme) {
      return NextResponse.json(
        { error: 'Grading scheme not found or not accessible' },
        { status: 404 }
      );
    }

    // Check if any subjects are using this scheme
    if (scheme.subjects.length > 0) {
      return NextResponse.json(
        { 
          error: `Cannot delete grading scheme. It is currently being used by ${scheme.subjects.length} subject(s). Please change the grading scheme for those subjects first.` 
        },
        { status: 400 }
      );
    }

    // Delete the scheme (grades will be deleted automatically due to cascade)
    await prisma.gradingScheme.delete({
      where: {
        id: schemeId,
      },
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error deleting grading scheme:', error);
    return NextResponse.json(
      { error: 'Failed to delete grading scheme' },
      { status: 500 }
    );
  }
}