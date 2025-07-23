import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';
import { getSchoolFilter } from '@/lib/school-context';

// This tells Next.js to fetch fresh data on every request
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const teacherId = searchParams.get('teacherId');
    const classId = searchParams.get('classId');

    const { sessionClaims } = auth();
    const role = (sessionClaims?.metadata as { role?: string })?.role;

    if (!role) {
      return new NextResponse(
        JSON.stringify({ error: 'Not authenticated' }),
        { status: 401 }
      );
    }

    // Get school filter for current user
    const schoolFilter = await getSchoolFilter();

    const lessons = await prisma.lesson.findMany({
      where: {
        ...(schoolFilter.schoolId ? { schoolId: schoolFilter.schoolId } : {}), // Add school filtering
        ...(teacherId ? { teacherId } : {}),
        ...(classId ? { classId: parseInt(classId) } : {}),
      },
      include: {
        subject: true,
        teacher: true,
        class: true,
      },
    });

    return NextResponse.json(lessons);
  } catch (error) {
    console.error('Error fetching lessons:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500 }
    );
  }
}
