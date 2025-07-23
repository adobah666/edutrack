import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';
import { getSchoolFilter } from '@/lib/school-context';

export async function GET() {
  try {
    const { sessionClaims } = auth();
    const role = (sessionClaims?.metadata as { role?: string })?.role;

    if (role !== 'admin') {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 403 }
      );
    }

    // Get school filter for current user
    const schoolFilter = await getSchoolFilter();

    const classes = await prisma.class.findMany({
      where: schoolFilter.schoolId ? { schoolId: schoolFilter.schoolId } : {}, // Add school filtering
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    });

    return NextResponse.json(classes);
  } catch (error) {
    console.error('Error fetching classes:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500 }
    );
  }
}
