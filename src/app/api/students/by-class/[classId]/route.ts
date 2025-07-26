import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';
import { getSchoolFilter } from '@/lib/school-context';

export async function GET(
  request: Request,
  { params }: { params: { classId: string } }
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

    // Only admins and supervisors can view students for promotion
    if (!['admin', 'teacher'].includes(role)) {
      return NextResponse.json(
        { error: 'Not authorized to view students' },
        { status: 403 }
      );
    }

    const classId = parseInt(params.classId);
    if (isNaN(classId)) {
      return NextResponse.json(
        { error: 'Invalid class ID' },
        { status: 400 }
      );
    }

    // Get school filter for current user
    const schoolFilter = await getSchoolFilter();

    // For teachers, verify they are supervisor of this class or teach in this class
    if (role === 'teacher') {
      const classAccess = await prisma.class.findFirst({
        where: {
          id: classId,
          ...(schoolFilter.schoolId ? { schoolId: schoolFilter.schoolId } : {}),
          OR: [
            { supervisorId: userId }, // Is supervisor
            { 
              lessons: {
                some: {
                  teacherId: userId
                }
              }
            } // Teaches in this class
          ]
        },
      });

      if (!classAccess) {
        return NextResponse.json(
          { error: 'You are not authorized to view students in this class' },
          { status: 403 }
        );
      }
    }

    // Fetch students in the class
    const students = await prisma.student.findMany({
      where: {
        classId: classId,
        ...(schoolFilter.schoolId ? { schoolId: schoolFilter.schoolId } : {}),
      },
      include: {
        class: {
          include: {
            grade: true,
          },
        },
      },
      orderBy: [
        { name: 'asc' },
        { surname: 'asc' },
      ],
    });

    // Transform data for the response
    const studentsData = students.map(student => ({
      id: student.id,
      name: student.name,
      surname: student.surname,
      username: student.username,
      currentClass: {
        id: student.class.id,
        name: student.class.name,
        grade: {
          id: student.class.grade.id,
          name: student.class.grade.name,
          level: student.class.grade.level,
        },
      },
    }));

    return NextResponse.json(studentsData);

  } catch (error) {
    console.error('Error fetching students by class:', error);
    return NextResponse.json(
      { error: 'Failed to fetch students' },
      { status: 500 }
    );
  }
}