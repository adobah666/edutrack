import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';
import { getSchoolFilter } from '@/lib/school-context';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { sessionClaims } = auth();
    const role = (sessionClaims?.metadata as { role?: string })?.role;

    if (role !== 'admin') {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401 }
      );
    }

    const classId = parseInt(params.id);
    const { customOpeningTime, customClosingTime } = await request.json();

    // Validate time format if provided
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (customOpeningTime && !timeRegex.test(customOpeningTime)) {
      return new NextResponse(
        JSON.stringify({ error: 'Invalid opening time format. Use HH:MM format.' }),
        { status: 400 }
      );
    }
    if (customClosingTime && !timeRegex.test(customClosingTime)) {
      return new NextResponse(
        JSON.stringify({ error: 'Invalid closing time format. Use HH:MM format.' }),
        { status: 400 }
      );
    }

    // Validate that opening time is before closing time if both are provided
    if (customOpeningTime && customClosingTime) {
      const openingMinutes = parseInt(customOpeningTime.split(':')[0]) * 60 + parseInt(customOpeningTime.split(':')[1]);
      const closingMinutes = parseInt(customClosingTime.split(':')[0]) * 60 + parseInt(customClosingTime.split(':')[1]);
      
      if (openingMinutes >= closingMinutes) {
        return new NextResponse(
          JSON.stringify({ error: 'Opening time must be before closing time.' }),
          { status: 400 }
        );
      }
    }

    // Get school filter for current user
    const schoolFilter = await getSchoolFilter();
    
    if (!schoolFilter.schoolId) {
      return new NextResponse(
        JSON.stringify({ error: 'School context not found' }),
        { status: 400 }
      );
    }

    // Verify class belongs to the school
    const existingClass = await prisma.class.findFirst({
      where: {
        id: classId,
        schoolId: schoolFilter.schoolId,
      },
    });

    if (!existingClass) {
      return new NextResponse(
        JSON.stringify({ error: 'Class not found or access denied' }),
        { status: 404 }
      );
    }

    // Update class hours
    const updatedClass = await prisma.class.update({
      where: { id: classId },
      data: {
        customOpeningTime: customOpeningTime || null,
        customClosingTime: customClosingTime || null,
      },
      include: {
        classScheduleOverrides: true,
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Class hours updated successfully',
      ...updatedClass
    });

  } catch (error) {
    console.error('Error updating class hours:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500 }
    );
  }
}