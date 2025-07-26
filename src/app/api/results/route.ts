import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';
import { getSchoolFilter } from '@/lib/school-context';

// This tells Next.js to fetch fresh data on every request
export const dynamic = 'force-dynamic';

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

    // Get school filter for current user
    const schoolFilter = await getSchoolFilter();

    const { searchParams } = new URL(request.url);
    const examId = searchParams.get('examId');
    const assignmentId = searchParams.get('assignmentId');

    if (!examId && !assignmentId) {
      return NextResponse.json(
        { error: 'Either examId or assignmentId is required' },
        { status: 400 }
      );
    }

    // Build where clause based on whether it's an exam or assignment
    let whereClause: any = {};
    
    if (examId) {
      whereClause = {
        examId: parseInt(examId),
        ...(schoolFilter.schoolId ? {
          exam: {
            schoolId: schoolFilter.schoolId
          }
        } : {}), // Add school filtering through exam relationship
      };
    } else if (assignmentId) {
      whereClause = {
        assignmentId: parseInt(assignmentId),
        ...(schoolFilter.schoolId ? {
          assignment: {
            schoolId: schoolFilter.schoolId
          }
        } : {}), // Add school filtering through assignment relationship
      };
    }

    // Find all results for this exam/assignment with school filtering
    const results = await prisma.result.findMany({
      where: whereClause,
      select: {
        studentId: true
      }
    });

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error fetching exam results:', error);
    return NextResponse.json(
      { error: 'Failed to fetch exam results' },
      { status: 500 }
    );
  }
}
