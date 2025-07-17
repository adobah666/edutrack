// src/lib/email.ts
import { Resend } from 'resend';
import { ReminderEmailTemplate } from '@/components/emails/ReminderEmail';
import { UpcomingFeeEmailTemplate } from '@/components/emails/UpcomingFeeEmail';
import { OverdueFeeEmailTemplate } from '@/components/emails/OverdueFeeEmail';
import { differenceInDays } from 'date-fns';

const resend = new Resend(process.env.RESEND_API_KEY);

type SendEmailParams = {
  to: string;
  studentName: string;
  feeName: string;
  dueDate: Date;
  amount: number;
};

export async function sendPaymentReminder({
  to,
  studentName,
  feeName,
  dueDate,
  amount,
}: SendEmailParams) {
  try {
    await resend.emails.send({
      from: 'School Management System <no-reply@schoolmanagement.com>',
      to: [to],
      subject: `Payment Reminder: ${feeName} due on ${new Date(dueDate).toLocaleDateString()}`,
      react: ReminderEmailTemplate({
        studentName,
        feeName,
        dueDate: new Date(dueDate).toLocaleDateString(),
        amount,
      }),
    });
    return { success: true };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error };
  }
}

export async function sendUpcomingFeeReminder({
  to,
  studentName,
  feeName,
  dueDate,
  amount,
}: SendEmailParams) {
  const daysUntilDue = differenceInDays(dueDate, new Date());
  
  try {
    await resend.emails.send({
      from: 'School Management System <no-reply@schoolmanagement.com>',
      to: [to],
      subject: `Upcoming Fee Payment: ${feeName} due in ${daysUntilDue} days`,
      react: UpcomingFeeEmailTemplate({
        studentName,
        feeName,
        dueDate: dueDate.toLocaleDateString(),
        amount,
        daysUntilDue,
      }),
    });
    return { success: true };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error };
  }
}

export async function sendOverdueFeeReminder({
  to,
  studentName,
  feeName,
  dueDate,
  amount,
}: SendEmailParams) {
  const daysOverdue = differenceInDays(new Date(), dueDate);
  
  try {
    await resend.emails.send({
      from: 'School Management System <no-reply@schoolmanagement.com>',
      to: [to],
      subject: `Overdue Fee Payment Notice: ${feeName} - ${daysOverdue} days overdue`,
      react: OverdueFeeEmailTemplate({
        studentName,
        feeName,
        dueDate: dueDate.toLocaleDateString(),
        amount,
        daysOverdue,
      }),
    });
    return { success: true };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error };
  }
}
