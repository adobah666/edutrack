// src/lib/reminderService.ts
import prisma from './prisma';
import {
  sendPaymentReminder,
  sendUpcomingFeeReminder,
  sendOverdueFeeReminder,
} from './email';
import { addDays, isPast, differenceInDays } from 'date-fns';
import { Student, ClassFee, StudentFee, Class, FeeType, Prisma } from '@prisma/client';

type ClassFeeWithIncludes = {
  class: {
    students: Array<Student & {
      parent: {
        email: string | null;
      } | null;
    }>;
  };
  feeType: FeeType;
  studentFees: StudentFee[];
} & ClassFee;

export async function sendUpcomingPaymentReminders() {
  const today = new Date();
  const upcomingDays = [1, 3, 7]; // Days before due date to send reminders

  try {
    // Get all upcoming fees
    const upcomingFees = await prisma.classFee.findMany({
      where: {
        dueDate: {
          gt: today,
        },
      },
      include: {
        class: {
          include: {
            students: {
              include: {
                parent: true,
              },
            },
          },
        },
        feeType: true,
        studentFees: true,
      },
    }) as unknown as ClassFeeWithIncludes[];

    const results = [];

    for (const fee of upcomingFees) {
      const daysUntilDue = differenceInDays(fee.dueDate, today);
      
      // Only send reminders on specific days before due date
      if (!upcomingDays.includes(daysUntilDue)) {
        continue;
      }

      // Get students who haven't paid yet
      const studentsWithoutPayment = fee.class.students.filter((student: Student) => 
        !fee.studentFees.some((sf: StudentFee) => sf.studentId === student.id)
      );

      // Send reminder for each student
      for (const student of studentsWithoutPayment) {
        if (student.parent?.email) {
          const result = await sendUpcomingFeeReminder({
            to: student.parent.email,
            studentName: `${student.name} ${student.surname}`,
            feeName: fee.feeType.name,
            dueDate: fee.dueDate,
            amount: fee.amount,
          });

          // Log the reminder in the database
          await prisma.feeReminder.create({
            data: {
              studentFeeId: fee.id,
              type: 'UPCOMING',
              sentDate: today,
              successful: result.success,
              error: result.error ? String(result.error) : null,
            },
          });

          results.push({
            studentId: student.id,
            feeId: fee.id,
            success: result.success,
            error: result.error,
          });
        }
      }
    }

    return { success: true, results };
  } catch (error) {
    console.error('Error sending upcoming payment reminders:', error);
    return { success: false, error };
  }
}

export async function sendOverduePaymentReminders() {
  const today = new Date();
  const overdueDays = [1, 3, 7, 14, 30]; // Days after due date to send reminders

  try {
    // Get all fees that are past due
    const overdueFees = await prisma.classFee.findMany({
      where: {
        dueDate: {
          lt: today,
        },
      },
      include: {
        class: {
          include: {
            students: {
              include: {
                parent: true,
              },
            },
          },
        },
        feeType: true,
        studentFees: true,
      },
    }) as unknown as ClassFeeWithIncludes[];

    const results = [];

    for (const fee of overdueFees) {
      const daysOverdue = differenceInDays(today, fee.dueDate);
      
      // Only send reminders on specific overdue days
      if (!overdueDays.includes(daysOverdue)) {
        continue;
      }

      // Get students who still haven't paid
      const studentsWithoutPayment = fee.class.students.filter((student: Student) => 
        !fee.studentFees.some((sf: StudentFee) => sf.studentId === student.id)
      );

      // Send overdue reminder for each student
      for (const student of studentsWithoutPayment) {
        if (student.parent?.email) {
          const result = await sendOverdueFeeReminder({
            to: student.parent.email,
            studentName: `${student.name} ${student.surname}`,
            feeName: fee.feeType.name,
            dueDate: fee.dueDate,
            amount: fee.amount,
          });

          // Log the reminder in the database
          await prisma.feeReminder.create({
            data: {
              studentFeeId: fee.id,
              type: 'OVERDUE',
              sentDate: today,
              successful: result.success,
              error: result.error ? String(result.error) : null,
            },
          });

          results.push({
            studentId: student.id,
            feeId: fee.id,
            success: result.success,
            error: result.error,
          });
        }
      }
    }

    return { success: true, results };
  } catch (error) {
    console.error('Error sending overdue payment reminders:', error);
    return { success: false, error };
  }
}

export async function sendPaymentReminders() {
  const upcoming = await sendUpcomingPaymentReminders();
  const overdue = await sendOverduePaymentReminders();
  return { upcoming, overdue };
}
