// src/lib/reportsService.ts
import prisma from './prisma';
import { Prisma } from '@prisma/client';

export type FeeReportFilters = {
  startDate?: Date;
  endDate?: Date;
  classId?: number;
  feeTypeId?: number;
};

export type FeeReport = {
  totalAmount: number;
  collectedAmount: number;
  pendingAmount: number;
  paymentCount: number;
  overdueCount: number;
  collectionRate: number;
  payments: {
    date: Date;
    amount: number;
    student: { name: string; surname: string };
    class: { name: string };
    feeType: { name: string };
  }[];
};

export async function generateFeeReport(filters: FeeReportFilters): Promise<FeeReport> {
  const where: any = {};
  
  // Add date filters
  if (filters.startDate || filters.endDate) {
    where.paidDate = {};
    if (filters.startDate) where.paidDate.gte = filters.startDate;
    if (filters.endDate) where.paidDate.lte = filters.endDate;
  }

  // Add class filter
  if (filters.classId) {
    where.classFee = {
      classId: filters.classId,
    };
  }

  // Add fee type filter
  if (filters.feeTypeId) {
    where.classFee = {
      ...where.classFee,
      feeTypeId: filters.feeTypeId,
    };
  }

  // Get payments with details
  const payments = await prisma.studentFee.findMany({
    where,
    include: {
      student: {
        select: {
          name: true,
          surname: true,
        },
      },
      classFee: {
        include: {
          class: {
            select: {
              name: true,
            },
          },
          feeType: {
            select: {
              name: true,
            },
          },
        },
      },
    },
    orderBy: {
      paidDate: 'desc',
    },
  });

  // Get total expected amount
  const classFees = await prisma.classFee.findMany({
    where: filters.classId || filters.feeTypeId ? {
      classId: filters.classId,
      feeTypeId: filters.feeTypeId,
    } : undefined,
  });

  const totalAmount = classFees.reduce((sum, fee) => sum + fee.amount, 0);
  const collectedAmount = payments.reduce((sum, payment) => sum + payment.amount, 0);
  
  // Count overdue payments
  const now = new Date();
  const overdueCount = classFees.filter(fee => 
    new Date(fee.dueDate) < now && 
    !payments.some(p => p.classFeeId === fee.id)
  ).length;

  return {
    totalAmount,
    collectedAmount,
    pendingAmount: totalAmount - collectedAmount,
    paymentCount: payments.length,
    overdueCount,
    collectionRate: (collectedAmount / totalAmount) * 100,
    payments: payments.map(p => ({
      date: p.paidDate,
      amount: p.amount,
      student: p.student,
      class: p.classFee.class,
      feeType: p.classFee.feeType,
    })),
  };
}
