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

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const classId = searchParams.get('classId');
    const term = searchParams.get('term');

    if (!studentId || !classId || !term) {
      return NextResponse.json(
        { error: 'Student ID, class ID, and term are required' },
        { status: 400 }
      );
    }

    // Get school filter for current user
    const schoolFilter = await getSchoolFilter();

    // For students, ensure they can only access their own data
    if (role === 'student' && userId !== studentId) {
      return NextResponse.json(
        { error: 'Students can only access their own results' },
        { status: 403 }
      );
    }

    // Get student information (don't filter by classId since we want to allow historical class queries)
    const student = await prisma.student.findFirst({
      where: {
        id: studentId,
        ...(schoolFilter.schoolId ? { schoolId: schoolFilter.schoolId } : {}),
      },
      include: {
        class: true,
      },
    });

    if (!student) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    // Get the class information for the requested classId (could be current or historical)
    const requestedClass = await prisma.class.findFirst({
      where: {
        id: parseInt(classId),
        ...(schoolFilter.schoolId ? { schoolId: schoolFilter.schoolId } : {}),
      },
    });

    if (!requestedClass) {
      return NextResponse.json(
        { error: 'Class not found' },
        { status: 404 }
      );
    }

    // Get all subjects for this class
    const subjects = await prisma.subject.findMany({
      where: {
        ...(schoolFilter.schoolId ? { schoolId: schoolFilter.schoolId } : {}),
        OR: [
          // Subjects that have exams for this class and term
          {
            exams: {
              some: {
                classId: parseInt(classId),
                term: term as any,
              },
            },
          },
          // Subjects that have assignments for this class and term
          {
            assignments: {
              some: {
                classId: parseInt(classId),
                term: term as any,
              },
            },
          },
        ],
      },
      include: {
        termWeights: {
          where: {
            term: term as any,
          },
        },
        gradingScheme: {
          include: {
            grades: {
              orderBy: {
                order: 'asc',
              },
            },
          },
        },
        school: {
          select: {
            gradingSchemes: {
              where: {
                isDefault: true,
              },
              include: {
                grades: {
                  orderBy: {
                    order: 'asc',
                  },
                },
              },
            },
          },
        },
      },
    });

    const subjectResults = [];
    let totalWeightedScore = 0;
    let gradedSubjectsCount = 0;

    for (const subject of subjects) {
      // Determine effective weights (term-specific or general)
      const termWeight = subject.termWeights[0];
      const effectiveAssignmentWeight = termWeight?.assignmentWeight ?? subject.assignmentWeight;
      const effectiveExamWeight = termWeight?.examWeight ?? subject.examWeight;

      // Get assignments for this subject, class, and term
      const assignments = await prisma.assignment.findMany({
        where: {
          classId: parseInt(classId),
          subjectId: subject.id,
          term: term as any,
          ...(schoolFilter.schoolId ? { schoolId: schoolFilter.schoolId } : {}),
        },
        include: {
          results: {
            where: {
              studentId: studentId,
            },
          },
        },
      });

      // Get exams for this subject, class, and term
      const exams = await prisma.exam.findMany({
        where: {
          classId: parseInt(classId),
          subjectId: subject.id,
          term: term as any,
          ...(schoolFilter.schoolId ? { schoolId: schoolFilter.schoolId } : {}),
        },
        include: {
          results: {
            where: {
              studentId: studentId,
            },
          },
        },
      });

      // Calculate assignment average
      let assignmentTotal = 0;
      let assignmentCount = 0;
      assignments.forEach((assignment) => {
        assignment.results.forEach((result) => {
          const percentage = (result.score / assignment.maxPoints) * 100;
          assignmentTotal += percentage;
          assignmentCount++;
        });
      });
      const assignmentAverage = assignmentCount > 0 ? assignmentTotal / assignmentCount : 0;

      // Calculate exam average
      let examTotal = 0;
      let examCount = 0;
      exams.forEach((exam) => {
        exam.results.forEach((result) => {
          const percentage = (result.score / exam.maxPoints) * 100;
          examTotal += percentage;
          examCount++;
        });
      });
      const examAverage = examCount > 0 ? examTotal / examCount : 0;

      // Calculate final weighted percentage
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

      // Determine effective grading scheme
      const effectiveGradingScheme = subject.gradingScheme || subject.school.gradingSchemes[0];

      // Determine grade using custom grading scheme
      const getGrade = (percentage: number, hasGrades: boolean) => {
        if (!hasGrades) return 'Not Graded';
        
        if (!effectiveGradingScheme || !effectiveGradingScheme.grades.length) {
          // Fallback to hardcoded grades
          if (percentage >= 90) return 'A+';
          if (percentage >= 80) return 'A';
          if (percentage >= 70) return 'B+';
          if (percentage >= 60) return 'B';
          if (percentage >= 50) return 'C+';
          if (percentage >= 40) return 'C';
          if (percentage >= 30) return 'D';
          return 'F';
        }

        // Use custom grading scheme
        for (const grade of effectiveGradingScheme.grades) {
          if (percentage >= grade.minPercentage && percentage <= grade.maxPercentage) {
            return grade.grade;
          }
        }

        // If no grade matches, return the lowest grade
        const lowestGrade = effectiveGradingScheme.grades.reduce((lowest, current) => 
          current.order > lowest.order ? current : lowest
        );
        return lowestGrade.grade;
      };

      // Determine what to show for final percentage
      const getFinalPercentageDisplay = () => {
        if (!hasAnyGrades) return 'Not Graded';
        
        const percentageStr = finalPercentage.toFixed(1) + '%';
        
        // Check if this is partial grading
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

      const subjectResult = {
        subjectId: subject.id,
        subjectName: subject.name,
        assignmentAverage: assignmentCount > 0 ? assignmentAverage.toFixed(1) : 'No grades',
        examAverage: examCount > 0 ? examAverage.toFixed(1) : 'No grades',
        finalPercentage: getFinalPercentageDisplay(),
        grade: getGrade(finalPercentage, hasAnyGrades),
        assignmentCount,
        examCount,
        assignmentWeight: effectiveAssignmentWeight,
        examWeight: effectiveExamWeight,
        isUsingTermSpecificWeights: !!termWeight,
        hasAnyGrades,
        isPartialGrading: hasAnyGrades && ((assignments.length > 0 && assignmentCount === 0) || (exams.length > 0 && examCount === 0)),
      };

      subjectResults.push(subjectResult);

      // Add to overall average calculation (only if subject has grades)
      if (hasAnyGrades) {
        totalWeightedScore += finalPercentage;
        gradedSubjectsCount++;
      }
    }

    // Calculate overall average and grade
    const overallAverage = gradedSubjectsCount > 0 ? totalWeightedScore / gradedSubjectsCount : 0;
    
    // Use the first subject's grading scheme for overall grade (or default)
    const firstSubjectScheme = subjects[0]?.gradingScheme || subjects[0]?.school.gradingSchemes[0];
    
    const getOverallGrade = (percentage: number) => {
      if (gradedSubjectsCount === 0) return 'Not Graded';
      
      if (!firstSubjectScheme || !firstSubjectScheme.grades.length) {
        // Fallback to hardcoded grades
        if (percentage >= 90) return 'A+';
        if (percentage >= 80) return 'A';
        if (percentage >= 70) return 'B+';
        if (percentage >= 60) return 'B';
        if (percentage >= 50) return 'C+';
        if (percentage >= 40) return 'C';
        if (percentage >= 30) return 'D';
        return 'F';
      }

      // Use custom grading scheme
      for (const grade of firstSubjectScheme.grades) {
        if (percentage >= grade.minPercentage && percentage <= grade.maxPercentage) {
          return grade.grade;
        }
      }

      // If no grade matches, return the lowest grade
      const lowestGrade = firstSubjectScheme.grades.reduce((lowest, current) => 
        current.order > lowest.order ? current : lowest
      );
      return lowestGrade.grade;
    };

    return NextResponse.json({
      studentName: `${student.name} ${student.surname}`,
      className: requestedClass.name || 'Unknown Class', // Use the requested class name, not current class
      term,
      subjects: subjectResults,
      overallAverage: gradedSubjectsCount > 0 ? `${overallAverage.toFixed(1)}%` : 'Not Graded',
      overallGrade: getOverallGrade(overallAverage),
      totalSubjects: subjects.length,
      gradedSubjects: gradedSubjectsCount,
    });

  } catch (error) {
    console.error('Error fetching student term report:', error);
    return NextResponse.json(
      { error: 'Failed to fetch student term report' },
      { status: 500 }
    );
  }
}