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
    const { dayOfWeek, openingTime, closingTime } = await request.json();

    // Validate day of week
    const validDays = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];
    if (!validDays.includes(dayOfWeek)) {
      return new NextResponse(
        JSON.stringify({ error: 'Invalid day of week' }),
        { status: 400 }
      );
    }

    // Validate time format
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

    // Upsert day override
    await prisma.classScheduleOverride.upsert({
      where: {
        classId_dayOfWeek: {
          classId,
          dayOfWeek: dayOfWeek as any,
        },
      },
      update: {
        openingTime,
        closingTime,
      },
      create: {
        classId,
        dayOfWeek: dayOfWeek as any,
        openingTime,
        closingTime,
      },
    });

    // Return updated class with overrides
    const updatedClass = await prisma.class.findUnique({
      where: { id: classId },
      include: {
        classScheduleOverrides: true,
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Day override updated successfully',
      ...updatedClass
    });

  } catch (error) {
    console.error('Error updating day override:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500 }
    );
  }
}

export async function DELETE(
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
    const { dayOfWeek } = await request.json();

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

    // Delete day override
    await prisma.classScheduleOverride.delete({
      where: {
        classId_dayOfWeek: {
          classId,
          dayOfWeek: dayOfWeek as any,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Day override removed successfully'
    });

  } catch (error) {
    console.error('Error removing day override:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500 }
    );
  }
}