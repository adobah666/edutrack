import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';
import { getSchoolFilter } from '@/lib/school-context';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
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

    const studentId = params.id;

    // For students, ensure they can only access their own class history
    if (role === 'student' && userId !== studentId) {
      return NextResponse.json(
        { error: 'Students can only access their own class history' },
        { status: 403 }
      );
    }

    // Get school filter for current user with error handling
    let schoolFilter;
    try {
      schoolFilter = await getSchoolFilter();
    } catch (error) {
      console.error('Error getting school filter:', error);
      // Fallback: allow access without school filtering for now
      schoolFilter = { schoolId: null };
    }

    // Verify the student exists and belongs to the same school
    const student = await prisma.student.findFirst({
      where: {
        id: studentId,
        ...(schoolFilter.schoolId ? { schoolId: schoolFilter.schoolId } : {}),
      },
      include: {
        class: {
          include: {
            grade: true,
          },
        },
      },
    });

    if (!student) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    console.log('Student current class:', {
      studentId: student.id,
      currentClassId: student.classId,
      currentClassName: student.class.name,
      currentGradeName: student.class.grade.name
    });

    // Try to get class history from StudentClassHistory table with fallback
    let classHistory = [];
    try {
      classHistory = await prisma.studentClassHistory.findMany({
        where: {
          studentId: studentId,
        },
        include: {
          class: {
            include: {
              grade: true,
            },
          },
        },
        orderBy: [
          { isActive: 'desc' }, // Active class first
          { startDate: 'desc' }, // Then by most recent
        ],
      });
      
      console.log('Found class history records:', classHistory.map(h => ({
        classId: h.classId,
        className: h.class.name,
        isActive: h.isActive,
        academicYear: h.academicYear
      })));
    } catch (error) {
      console.error('Error fetching class history, using fallback:', error);
      // Fallback: return current class only
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth();
      const academicStartYear = currentMonth >= 8 ? currentYear : currentYear - 1;
      const academicEndYear = academicStartYear + 1;
      const currentAcademicYear = `${academicStartYear}-${academicEndYear}`;

      return NextResponse.json([{
        classId: student.classId,
        className: student.class.name,
        gradeName: student.class.grade.name,
        academicYear: currentAcademicYear,
        isActive: true,
        startDate: new Date(),
        endDate: null,
      }]);
    }

    // Check if the current class is in the history and is marked as active
    const currentClassInHistory = classHistory.find(h => h.classId === student.classId && h.isActive);
    
    console.log('Current class in history check:', {
      studentCurrentClassId: student.classId,
      currentClassInHistory: !!currentClassInHistory,
      historyLength: classHistory.length
    });
    
    // If current class is not in history, we need to fix the data
    if (!currentClassInHistory) {
      try {
        // Get current academic year
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth();
        const academicStartYear = currentMonth >= 8 ? currentYear : currentYear - 1;
        const academicEndYear = academicStartYear + 1;
        const currentAcademicYear = `${academicStartYear}-${academicEndYear}`;

        // Mark all existing history as inactive (student has moved to new class)
        if (classHistory.length > 0) {
          await prisma.studentClassHistory.updateMany({
            where: {
              studentId: studentId,
              isActive: true,
            },
            data: {
              isActive: false,
              endDate: new Date(),
            },
          });
        }

        // Create class history record for current class
        await prisma.studentClassHistory.create({
          data: {
            studentId: studentId,
            classId: student.classId,
            gradeId: student.gradeId,
            academicYear: currentAcademicYear,
            isActive: true,
            startDate: new Date(),
          },
        });

        // Fetch updated history
        const updatedHistory = await prisma.studentClassHistory.findMany({
          where: {
            studentId: studentId,
          },
          include: {
            class: {
              include: {
                grade: true,
              },
            },
          },
          orderBy: [
            { isActive: 'desc' },
            { startDate: 'desc' },
          ],
        });

        const historyData = updatedHistory.map(history => ({
          classId: history.classId,
          className: history.class.name,
          gradeName: history.class.grade.name,
          academicYear: history.academicYear,
          isActive: history.isActive,
          startDate: history.startDate,
          endDate: history.endDate,
        }));

        console.log('Fixed class history:', historyData);
        return NextResponse.json(historyData);

      } catch (error) {
        console.error('Error fixing class history, using fallback:', error);
        // Final fallback: return current class without creating history
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth();
        const academicStartYear = currentMonth >= 8 ? currentYear : currentYear - 1;
        const academicEndYear = academicStartYear + 1;
        const currentAcademicYear = `${academicStartYear}-${academicEndYear}`;

        // Ensure we always show the current class, even if we can't update history
        const fallbackHistory = [];
        
        // Add historical classes (marked as inactive)
        classHistory.forEach(h => {
          if (h.classId !== student.classId) {
            fallbackHistory.push({
              classId: h.classId,
              className: h.class.name,
              gradeName: h.class.grade.name,
              academicYear: h.academicYear,
              isActive: false,
              startDate: h.startDate,
              endDate: h.endDate || new Date(),
            });
          }
        });

        // Add current class
        fallbackHistory.unshift({
          classId: student.classId,
          className: student.class.name,
          gradeName: student.class.grade.name,
          academicYear: currentAcademicYear,
          isActive: true,
          startDate: new Date(),
          endDate: null,
        });

        console.log('Fallback class history:', fallbackHistory);
        return NextResponse.json(fallbackHistory);
      }
    }

    // Transform the data for the response
    const historyData = classHistory.map(history => ({
      classId: history.classId,
      className: history.class.name,
      gradeName: history.class.grade.name,
      academicYear: history.academicYear,
      isActive: history.isActive,
      startDate: history.startDate,
      endDate: history.endDate,
    }));

    return NextResponse.json(historyData);

  } catch (error) {
    console.error('Error fetching student class history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch class history' },
      { status: 500 }
    );
  }
}