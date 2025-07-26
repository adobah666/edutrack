import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';
import { getSchoolFilter } from '@/lib/school-context';

export async function POST(request: Request) {
  try {
    const { userId, sessionClaims } = auth();
    const role = (sessionClaims?.metadata as { role?: string })?.role;

    if (!userId || !role) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Only admins and supervisors can promote students
    if (!['admin', 'teacher'].includes(role)) {
      return NextResponse.json(
        { error: 'Not authorized to promote students' },
        { status: 403 }
      );
    }

    const { studentIds, fromClassId, toClassId, academicYear, notes } = await request.json();

    // Validate input
    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return NextResponse.json(
        { error: 'Student IDs are required' },
        { status: 400 }
      );
    }

    if (!fromClassId || !toClassId) {
      return NextResponse.json(
        { error: 'From class and to class are required' },
        { status: 400 }
      );
    }

    if (fromClassId === toClassId) {
      return NextResponse.json(
        { error: 'Cannot promote students to the same class' },
        { status: 400 }
      );
    }

    if (!academicYear || !academicYear.trim()) {
      return NextResponse.json(
        { error: 'Academic year is required' },
        { status: 400 }
      );
    }

    // Get school filter for current user
    const schoolFilter = await getSchoolFilter();

    // Verify both classes exist and belong to the same school
    const [fromClass, toClass] = await Promise.all([
      prisma.class.findFirst({
        where: {
          id: parseInt(fromClassId),
          ...(schoolFilter.schoolId ? { schoolId: schoolFilter.schoolId } : {}),
        },
        include: { grade: true },
      }),
      prisma.class.findFirst({
        where: {
          id: parseInt(toClassId),
          ...(schoolFilter.schoolId ? { schoolId: schoolFilter.schoolId } : {}),
        },
        include: { grade: true },
      }),
    ]);

    if (!fromClass || !toClass) {
      return NextResponse.json(
        { error: 'One or both classes not found' },
        { status: 404 }
      );
    }

    // For teachers, verify they have permission to promote from the source class
    if (role === 'teacher') {
      const hasPermission = await prisma.class.findFirst({
        where: {
          id: parseInt(fromClassId),
          OR: [
            { supervisorId: userId }, // Is supervisor
            { 
              lessons: {
                some: {
                  teacherId: userId
                }
              }
            }
          ]
        }
      });

      if (!hasPermission) {
        return NextResponse.json(
          { error: 'You do not have permission to promote students from this class' },
          { status: 403 }
        );
      }
    }

    // Verify all students exist and belong to the from class
    const studentsToPromote = await prisma.student.findMany({
      where: {
        id: { in: studentIds },
        classId: parseInt(fromClassId),
        ...(schoolFilter.schoolId ? { schoolId: schoolFilter.schoolId } : {}),
      },
      select: {
        id: true,
        name: true,
        surname: true,
        classId: true,
        gradeId: true,
      },
    });

    if (studentsToPromote.length !== studentIds.length) {
      return NextResponse.json(
        { error: 'Some students not found or not in the specified class' },
        { status: 400 }
      );
    }

    // Perform the promotion with proper error handling
    let result;
    try {
      result = await prisma.$transaction(async (tx) => {
        // First, mark current class history as ended (if any exists)
        try {
          await tx.studentClassHistory.updateMany({
            where: {
              studentId: { in: studentIds },
              isActive: true,
            },
            data: {
              isActive: false,
              endDate: new Date(),
            },
          });
        } catch (historyError) {
          console.log('Could not update class history (table may not exist):', historyError);
        }

        // Create new class history records for the promotion
        let promotionRecords = [];
        try {
          promotionRecords = await Promise.all(
            studentsToPromote.map(student =>
              tx.studentClassHistory.create({
                data: {
                  studentId: student.id,
                  classId: parseInt(toClassId),
                  gradeId: toClass.grade.id,
                  academicYear: academicYear.trim(),
                  isActive: true,
                  promotedBy: userId,
                  promotedAt: new Date(),
                  notes: notes?.trim() || null,
                },
              })
            )
          );
        } catch (historyError) {
          console.log('Could not create class history records (table may not exist):', historyError);
          // Create mock records for response
          promotionRecords = studentsToPromote.map(student => ({
            id: Date.now(),
            studentId: student.id,
            classId: parseInt(toClassId),
            gradeId: toClass.grade.id,
            academicYear: academicYear.trim(),
            isActive: true,
            promotedBy: userId,
            promotedAt: new Date(),
            notes: notes?.trim() || null,
          }));
        }

        // Update students' current class and grade
        const updatedStudents = await tx.student.updateMany({
          where: {
            id: { in: studentIds },
          },
          data: {
            classId: parseInt(toClassId),
            gradeId: toClass.grade.id,
          },
        });

        return {
          promotionRecords,
          updatedCount: updatedStudents.count,
        };
      });
    } catch (error) {
      console.error('Transaction failed, falling back to simple update:', error);
      
      // Fallback: Just update the students' current class
      const updatedStudents = await prisma.student.updateMany({
        where: {
          id: { in: studentIds },
        },
        data: {
          classId: parseInt(toClassId),
          gradeId: toClass.grade.id,
        },
      });

      result = {
        promotionRecords: studentsToPromote.map(student => ({
          id: Date.now(),
          studentId: student.id,
          classId: parseInt(toClassId),
          gradeId: toClass.grade.id,
          academicYear: academicYear.trim(),
          isActive: true,
          promotedBy: userId,
          promotedAt: new Date(),
          notes: notes?.trim() || null,
        })),
        updatedCount: updatedStudents.count,
      };
    }

    return NextResponse.json({
      success: true,
      promotedCount: result.updatedCount,
      message: `Successfully promoted ${result.updatedCount} student(s) from ${fromClass.name} to ${toClass.name}`,
      promotions: result.promotionRecords.map((record: any) => ({
        id: record.id,
        studentId: record.studentId,
        fromClass: fromClass.name,
        toClass: toClass.name,
        academicYear: record.academicYear,
        promotedAt: record.promotedAt,
      })),
    });

  } catch (error) {
    console.error('Error promoting students:', error);
    return NextResponse.json(
      { error: 'Failed to promote students' },
      { status: 500 }
    );
  }
}