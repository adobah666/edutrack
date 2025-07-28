import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';
import { getSchoolFilter } from '@/lib/school-context';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { sessionClaims } = auth();
    const role = (sessionClaims?.metadata as { role?: string })?.role;

    // Only admins and teachers can access class details
    if (!['admin', 'teacher'].includes(role || '')) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 403 }
      );
    }

    const classId = parseInt(params.id);

    // Get school filter for current user
    const schoolFilter = await getSchoolFilter();

    const classData = await prisma.class.findFirst({
      where: {
        id: classId,
        ...(schoolFilter.schoolId ? { schoolId: schoolFilter.schoolId } : {}),
      },
      include: {
        grade: true,
        classScheduleOverrides: true,
      },
    });

    if (!classData) {
      return new NextResponse(
        JSON.stringify({ error: 'Class not found' }),
        { status: 404 }
      );
    }

    return NextResponse.json(classData);
  } catch (error) {
    console.error('Error fetching class:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500 }
    );
  }
}