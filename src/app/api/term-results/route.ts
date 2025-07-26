import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';
import { getSchoolFilter } from '@/lib/school-context';

export async function GET(request: Request) {
  try {
    const { userId, sessionClaims } = auth();
    const role = (sessionClaims?.metadata as { role?: string })?.role;

    if (!userId || !role) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const schoolFilter = await getSchoolFilter();
    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('classId');
    const subjectId = searchParams.get('subjectId');
    const term = searchParams.get('term');

    if (!classId || !subjectId || !term) {
      return NextResponse.json(
        { error: 'classId, subjectId, and term are required' },
        { status: 400 }
      );
    }

    // Get all students in the class
    const students = await prisma.student.findMany({
      where: {
        classId: parseInt(classId),
        ...(schoolFilter.schoolId ? { schoolId: schoolFilter.schoolId } : {}),
      },
      select: {
        id: true,
        name: true,
        surname: true,
      },
      orderBy: [
        { name: 'asc' },
        { surname: 'asc' },
      ],
    });

    // Get subject with category weights
    const subject = await prisma.subject.findUnique({
      where: { id: parseInt(subjectId) },
      select: {
        name: true,
        assignmentWeight: true,
        examWeight: true,
        termWeights: {
          where: {
            term: term as any,
          },
        },
      },
    });

    if (!subject) {
      return NextResponse.json(
        { error: 'Subject not found' },
        { status: 404 }
      );
    }

    // Determine effective weights (term-specific or general)
    const termWeight = subject.termWeights[0]; // Should be only one for the specific term
    const effectiveAssignmentWeight = termWeight?.assignmentWeight ?? subject.assignmentWeight;
    const effectiveExamWeight = termWeight?.examWeight ?? subject.examWeight;

    // Get all exams for this subject, class, and term
    const exams = await prisma.exam.findMany({
      where: {
        classId: parseInt(classId),
        subjectId: parseInt(subjectId),
        term: term as any,
        ...(schoolFilter.schoolId ? { schoolId: schoolFilter.schoolId } : {}),
      },
      include: {
        results: {
          where: {
            studentId: { in: students.map(s => s.id) },
          },
        },
      },
    });

    // Get all assignments for this subject, class, and term
    const assignments = await prisma.assignment.findMany({
      where: {
        classId: parseInt(classId),
        subjectId: parseInt(subjectId),
        term: term as any,
        ...(schoolFilter.schoolId ? { schoolId: schoolFilter.schoolId } : {}),
      },
      include: {
        results: {
          where: {
            studentId: { in: students.map(s => s.id) },
          },
        },
      },
    });

    // Calculate category-based weighted scores for each student
    const studentResults = students.map(student => {
      const breakdown: any[] = [];
      
      // Calculate assignment average
      let assignmentTotal = 0;
      let assignmentCount = 0;
      
      assignments.forEach(assignment => {
        const result = assignment.results.find(r => r.studentId === student.id);
        if (result) {
          const percentage = (result.score / assignment.maxPoints) * 100;
          assignmentTotal += percentage;
          assignmentCount++;

          breakdown.push({
            type: 'assignment',
            title: assignment.title,
            score: result.score,
            maxPoints: assignment.maxPoints,
            percentage: percentage.toFixed(1),
            categoryWeight: effectiveAssignmentWeight,
          });
        }
      });

      // Calculate exam average
      let examTotal = 0;
      let examCount = 0;
      
      exams.forEach(exam => {
        const result = exam.results.find(r => r.studentId === student.id);
        if (result) {
          const percentage = (result.score / exam.maxPoints) * 100;
          examTotal += percentage;
          examCount++;

          breakdown.push({
            type: 'exam',
            title: exam.title,
            score: result.score,
            maxPoints: exam.maxPoints,
            percentage: percentage.toFixed(1),
            categoryWeight: effectiveExamWeight,
          });
        }
      });

      // Calculate category averages
      const assignmentAverage = assignmentCount > 0 ? assignmentTotal / assignmentCount : 0;
      const examAverage = examCount > 0 ? examTotal / examCount : 0;

      // Calculate final weighted percentage (no scaling - respect actual weights)
      let finalPercentage = 0;
      let hasAnyGrades = false;

      if (assignmentCount > 0) {
        finalPercentage += assignmentAverage * effectiveAssignmentWeight;
        hasAnyGrades = true;
      }

      if (examCount > 0) {
        finalPercentage += examAverage * effectiveExamWeight;
        hasAnyGrades = true;
      }

      // Don't scale up partial grades - respect the actual weight system
      // If a student only has exams (70% weight), their max possible score is 70%
      // If they have no grades at all, mark as ungraded

      // Determine grade and display logic
      const getGrade = (percentage: number, hasGrades: boolean) => {
        if (!hasGrades) return 'Not Graded';
        if (percentage >= 90) return 'A+';
        if (percentage >= 80) return 'A';
        if (percentage >= 70) return 'B+';
        if (percentage >= 60) return 'B';
        if (percentage >= 50) return 'C+';
        if (percentage >= 40) return 'C';
        if (percentage >= 30) return 'D';
        return 'F';
      };

      // Determine what to show for final percentage
      const getFinalPercentageDisplay = () => {
        if (!hasAnyGrades) return 'Not Graded';
        
        // Show the actual weighted percentage (no scaling)
        // Add indicator if it's partial grading
        const percentageStr = finalPercentage.toFixed(1) + '%';
        
        // Check if this is partial grading (missing either assignments or exams)
        const missingAssignments = assignments.length > 0 && assignmentCount === 0;
        const missingExams = exams.length > 0 && examCount === 0;
        
        if (missingAssignments && missingExams) {
          return 'Not Graded';
        } else if (missingAssignments) {
          return `${percentageStr} (No assignments)`;
        } else if (missingExams) {
          return `${percentageStr} (No exams)`;
        }
        
        return percentageStr;
      };

      return {
        student: {
          id: student.id,
          name: student.name,
          surname: student.surname,
        },
        finalPercentage: getFinalPercentageDisplay(),
        grade: getGrade(finalPercentage, hasAnyGrades),
        assignmentAverage: assignmentCount > 0 ? assignmentAverage.toFixed(1) : 'No grades',
        examAverage: examCount > 0 ? examAverage.toFixed(1) : 'No grades',
        assignmentCount,
        examCount,
        breakdown,
        hasAnyGrades,
        isPartialGrading: hasAnyGrades && ((assignments.length > 0 && assignmentCount === 0) || (exams.length > 0 && examCount === 0)),
      };
    });

    // Get class info
    const classInfo = await prisma.class.findUnique({
      where: { id: parseInt(classId) },
      select: { name: true },
    });

    return NextResponse.json({
      subject: subject.name,
      class: classInfo?.name,
      term,
      totalExams: exams.length,
      totalAssignments: assignments.length,
      assignmentWeight: effectiveAssignmentWeight,
      examWeight: effectiveExamWeight,
      categoryWeights: {
        assignments: `${(effectiveAssignmentWeight * 100).toFixed(0)}%`,
        exams: `${(effectiveExamWeight * 100).toFixed(0)}%`,
      },
      isUsingTermSpecificWeights: !!termWeight,
      results: studentResults,
    });

  } catch (error) {
    console.error('Error calculating term results:', error);
    return NextResponse.json(
      { error: 'Failed to calculate term results' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { userId, sessionClaims } = auth();
    const role = (sessionClaims?.metadata as { role?: string })?.role;

    if (!userId || role !== 'admin') {
      return NextResponse.json(
        { error: 'Not authorized' },
        { status: 401 }
      );
    }

    const schoolFilter = await getSchoolFilter();
    const body = await request.json();
    const { examId, assignmentId, weight } = body;

    if ((!examId && !assignmentId) || !weight) {
      return NextResponse.json(
        { error: 'examId or assignmentId, and weight are required' },
        { status: 400 }
      );
    }

    if (examId) {
      await prisma.exam.update({
        where: { 
          id: parseInt(examId),
          ...(schoolFilter.schoolId ? { schoolId: schoolFilter.schoolId } : {}),
        },
        data: { weight: parseFloat(weight) },
      });
    }

    if (assignmentId) {
      await prisma.assignment.update({
        where: { 
          id: parseInt(assignmentId),
          ...(schoolFilter.schoolId ? { schoolId: schoolFilter.schoolId } : {}),
        },
        data: { weight: parseFloat(weight) },
      });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error updating weight:', error);
    return NextResponse.json(
      { error: 'Failed to update weight' },
      { status: 500 }
    );
  }
}