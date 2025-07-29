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

    // Get all payments made by the student across all classes
    const payments = await prisma.studentFee.findMany({
      where: {
        studentId,
        ...(schoolFilter.schoolId && { schoolId: schoolFilter.schoolId })
      },
      include: {
        classFee: {
          include: {
            feeType: {
              select: {
                id: true,
                name: true,
                isOptional: true
              }
            },
            class: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        student: {
          select: {
            id: true,
            name: true,
            surname: true
          }
        }
      },
      orderBy: {
        paidDate: 'desc'
      }
    });

    // Group payments by academic year/class for better organization
    const groupedPayments = payments.reduce((acc, payment) => {
      const className = payment.classFee.class?.name || 'General Fees';
      if (!acc[className]) {
        acc[className] = [];
      }
      acc[className].push(payment);
      return acc;
    }, {} as Record<string, typeof payments>);

    // Calculate totals
    const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
    const mandatoryPayments = payments.filter(p => !p.classFee.feeType.isOptional);
    const optionalPayments = payments.filter(p => p.classFee.feeType.isOptional);
    const totalMandatoryPaid = mandatoryPayments.reduce((sum, payment) => sum + payment.amount, 0);
    const totalOptionalPaid = optionalPayments.reduce((sum, payment) => sum + payment.amount, 0);

    return NextResponse.json({
      payments,
      groupedPayments,
      summary: {
        totalPayments: payments.length,
        totalPaid,
        totalMandatoryPaid,
        totalOptionalPaid,
        mandatoryPayments: mandatoryPayments.length,
        optionalPayments: optionalPayments.length
      }
    });

  } catch (error) {
    console.error('Error fetching payment history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payment history' },
      { status: 500 }
    );
  }
}