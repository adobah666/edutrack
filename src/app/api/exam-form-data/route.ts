import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';
import { getSchoolFilter } from '@/lib/school-context';

export async function GET() {
  try {
    const { userId, sessionClaims } = auth();
    const role = (sessionClaims?.metadata as { role?: string })?.role;

    if (!userId || !role) {
      return new NextResponse(
        JSON.stringify({ error: 'Not authenticated' }),
        { status: 401 }
      );
    }

    // Get school filter for current user
    const schoolFilter = await getSchoolFilter();

    // Fetch subjects with teacher filter if role is teacher
    const subjects = await prisma.subject.findMany({
      where: role === "teacher" ? {
        ...(schoolFilter.schoolId ? { schoolId: schoolFilter.schoolId } : {}),
        teachers: {
          some: {
            id: userId
          }
        }
      } : (schoolFilter.schoolId ? { schoolId: schoolFilter.schoolId } : {}),
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });

    // Fetch classes for the teacher or all classes for admin
    const classes = await prisma.class.findMany({
      where: role === "teacher" ? {
        ...(schoolFilter.schoolId ? { schoolId: schoolFilter.schoolId } : {}),
        supervisorId: userId
      } : (schoolFilter.schoolId ? { schoolId: schoolFilter.schoolId } : {}),
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({
      subjects,
      classes,
    });
  } catch (error) {
    console.error('Error fetching exam form data:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500 }
    );
  }
}