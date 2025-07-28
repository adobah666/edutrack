import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSchoolFilter } from '@/lib/school-context';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');

    if (!studentId) {
      return NextResponse.json({ error: 'Student ID is required' }, { status: 400 });
    }

    const schoolFilter = await getSchoolFilter();

    // Get student's class history
    const classHistory = await prisma.studentClassHistory.findMany({
      where: {
        studentId,
        ...(schoolFilter.schoolId && { 
          student: { 
            schoolId: schoolFilter.schoolId 
          } 
        })
      },
      include: {
        class: {
          include: {
            classFees: {
              where: schoolFilter.schoolId ? { schoolId: schoolFilter.schoolId } : {},
              include: {
                feeType: {
                  select: {
                    id: true,
                    name: true,
                    isOptional: true
                  }
                },
                studentFees: {
                  where: { studentId }
                }
              }
            }
          }
        }
      },
      orderBy: {
        startDate: 'desc'
      }
    });

    // Also get current class fees if student is currently enrolled
    const currentStudent = await prisma.student.findUnique({
      where: { 
        id: studentId,
        ...(schoolFilter.schoolId && { schoolId: schoolFilter.schoolId })
      },
      include: {
        class: {
          include: {
            classFees: {
              where: schoolFilter.schoolId ? { schoolId: schoolFilter.schoolId } : {},
              include: {
                feeType: {
                  select: {
                    id: true,
                    name: true,
                    isOptional: true
                  }
                },
                studentFees: {
                  where: { studentId }
                }
              }
            }
          }
        }
      }
    });

    // Combine historical and current class fees
    const allClassFees = [];

    // Add historical class fees
    classHistory.forEach(history => {
      if (history.class.classFees.length > 0) {
        allClassFees.push({
          classId: history.class.id,
          className: history.class.name,
          period: `${history.startDate.toLocaleDateString()} - ${history.endDate ? history.endDate.toLocaleDateString() : 'Present'}`,
          isHistorical: true,
          startDate: history.startDate,
          endDate: history.endDate,
          fees: history.class.classFees.map(classFee => {
            const totalPaid = classFee.studentFees.reduce((sum, fee) => sum + fee.amount, 0);
            const remainingAmount = classFee.amount - totalPaid;
            const isPaid = remainingAmount <= 0;

            return {
              id: classFee.id,
              feeType: classFee.feeType.name,
              isOptional: classFee.feeType.isOptional,
              totalAmount: classFee.amount,
              totalPaid,
              remainingAmount: Math.max(0, remainingAmount),
              isPaid,
              dueDate: classFee.dueDate,
              payments: classFee.studentFees.map(fee => ({
                id: fee.id,
                amount: fee.amount,
                paidDate: fee.paidDate
              }))
            };
          })
        });
      }
    });

    // Add current class fees if not already in history
    if (currentStudent?.class && !classHistory.some(h => h.classId === currentStudent.classId)) {
      allClassFees.push({
        classId: currentStudent.class.id,
        className: currentStudent.class.name,
        period: 'Current Class',
        isHistorical: false,
        startDate: new Date(),
        endDate: null,
        fees: currentStudent.class.classFees.map(classFee => {
          const totalPaid = classFee.studentFees.reduce((sum, fee) => sum + fee.amount, 0);
          const remainingAmount = classFee.amount - totalPaid;
          const isPaid = remainingAmount <= 0;

          return {
            id: classFee.id,
            feeType: classFee.feeType.name,
            isOptional: classFee.feeType.isOptional,
            totalAmount: classFee.amount,
            totalPaid,
            remainingAmount: Math.max(0, remainingAmount),
            isPaid,
            dueDate: classFee.dueDate,
            payments: classFee.studentFees.map(fee => ({
              id: fee.id,
              amount: fee.amount,
              paidDate: fee.paidDate
            }))
          };
        })
      });
    }

    // Sort by start date (most recent first)
    allClassFees.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());

    // Calculate overall summary
    const allFees = allClassFees.flatMap(classData => classData.fees);
    const totalFees = allFees.reduce((sum, fee) => sum + fee.totalAmount, 0);
    const totalPaid = allFees.reduce((sum, fee) => sum + fee.totalPaid, 0);
    const totalOutstanding = allFees.reduce((sum, fee) => sum + fee.remainingAmount, 0);
    const mandatoryFees = allFees.filter(fee => !fee.isOptional);
    const optionalFees = allFees.filter(fee => fee.isOptional);

    return NextResponse.json({
      classFeesHistory: allClassFees,
      summary: {
        totalClasses: allClassFees.length,
        totalFees,
        totalPaid,
        totalOutstanding,
        mandatoryFeesTotal: mandatoryFees.reduce((sum, fee) => sum + fee.totalAmount, 0),
        optionalFeesTotal: optionalFees.reduce((sum, fee) => sum + fee.totalAmount, 0),
        mandatoryFeesPaid: mandatoryFees.reduce((sum, fee) => sum + fee.totalPaid, 0),
        optionalFeesPaid: optionalFees.reduce((sum, fee) => sum + fee.totalPaid, 0)
      }
    });

  } catch (error) {
    console.error('Error fetching fees history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch fees history' },
      { status: 500 }
    );
  }
}