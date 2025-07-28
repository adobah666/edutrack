import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';
import { getSchoolFilter } from '@/lib/school-context';

export async function PUT(request: Request) {
  try {
    const { sessionClaims } = auth();
    const role = (sessionClaims?.metadata as { role?: string })?.role;

    if (role !== 'admin') {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401 }
      );
    }

    const { openingTime, closingTime } = await request.json();

    // Validate time format (HH:MM)
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(openingTime) || !timeRegex.test(closingTime)) {
      return new NextResponse(
        JSON.stringify({ error: 'Invalid time format. Use HH:MM format.' }),
        { status: 400 }
      );
    }

    // Validate that opening time is before closing time
    const openingMinutes = parseInt(openingTime.split(':')[0]) * 60 + parseInt(openingTime.split(':')[1]);
    const closingMinutes = parseInt(closingTime.split(':')[0]) * 60 + parseInt(closingTime.split(':')[1]);
    
    if (openingMinutes >= closingMinutes) {
      return new NextResponse(
        JSON.stringify({ error: 'Opening time must be before closing time.' }),
        { status: 400 }
      );
    }

    // Get school filter for current user
    const schoolFilter = await getSchoolFilter();
    
    if (!schoolFilter.schoolId) {
      return new NextResponse(
        JSON.stringify({ error: 'School context not found' }),
        { status: 400 }
      );
    }

    // Update school hours
    const updatedSchool = await prisma.school.update({
      where: { id: schoolFilter.schoolId },
      data: {
        openingTime,
        closingTime,
      },
      select: {
        id: true,
        name: true,
        openingTime: true,
        closingTime: true,
      }
    });

    return NextResponse.json({
      success: true,
      message: 'School hours updated successfully',
      school: updatedSchool
    });

  } catch (error) {
    console.error('Error updating school hours:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const { sessionClaims } = auth();
    const role = (sessionClaims?.metadata as { role?: string })?.role;

    if (role !== 'admin') {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401 }
      );
    }

    // Get school filter for current user
    const schoolFilter = await getSchoolFilter();
    
    if (!schoolFilter.schoolId) {
      return new NextResponse(
        JSON.stringify({ error: 'School context not found' }),
        { status: 400 }
      );
    }

    // Get current school hours
    const school = await prisma.school.findUnique({
      where: { id: schoolFilter.schoolId },
      select: {
        id: true,
        name: true,
        openingTime: true,
        closingTime: true,
      }
    });

    if (!school) {
      return new NextResponse(
        JSON.stringify({ error: 'School not found' }),
        { status: 404 }
      );
    }

    return NextResponse.json(school);

  } catch (error) {
    console.error('Error fetching school hours:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500 }
    );
  }
}