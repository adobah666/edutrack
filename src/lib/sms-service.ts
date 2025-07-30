import { env } from './env';

interface SMSResponse {
  success: boolean;
  message: string;
  messageId?: string;
}

export class SMSService {
  private static readonly BASE_URL = 'https://smsc.hubtel.com/v1/messages/send';
  
  // Helper function to get all phone numbers for a student (student + parents)
  static getStudentPhoneNumbers(student: {
    phone?: string | null;
    parentStudents: {
      parent: {
        phone?: string | null;
      };
    }[];
  }): string[] {
    const phoneNumbers: string[] = [];
    
    // Add student's own phone if available
    if (student.phone) {
      phoneNumbers.push(student.phone);
    }
    
    // Add parent phones as fallback or additional contacts
    for (const parentStudent of student.parentStudents) {
      if (parentStudent.parent.phone) {
        phoneNumbers.push(parentStudent.parent.phone);
      }
    }
    
    return phoneNumbers;
  }
  
  static async sendSMS(to: string, content: string, from?: string): Promise<SMSResponse> {
    try {
      const params = new URLSearchParams({
        clientid: env.HUBTEL_CLIENT_ID,
        clientsecret: env.HUBTEL_CLIENT_SECRET,
        from: from || env.HUBTEL_SMS_FROM,
        to: to.replace(/\D/g, ''), // Remove non-digits
        content: content
      });

      const response = await fetch(`${this.BASE_URL}?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      
      if (response.ok) {
        return {
          success: true,
          message: 'SMS sent successfully',
          messageId: result.messageId
        };
      } else {
        return {
          success: false,
          message: result.message || 'Failed to send SMS'
        };
      }
    } catch (error) {
      console.error('SMS sending error:', error);
      return {
        success: false,
        message: 'Network error occurred while sending SMS'
      };
    }
  }

  // Template messages for different scenarios
  static getWelcomeMessage(userType: 'student' | 'parent' | 'teacher', name: string, username: string, password: string, schoolName: string): string {
    const messages = {
      student: `Welcome to ${schoolName}! Your student account has been created. Username: ${username}, Password: ${password}. Please change your password after first login.`,
      parent: `Welcome to ${schoolName}! Your parent account has been created. Username: ${username}, Password: ${password}. You can now track your child's progress.`,
      teacher: `Welcome to ${schoolName}! Your teacher account has been created. Username: ${username}, Password: ${password}. Access your dashboard to manage classes.`
    };
    return messages[userType];
  }

  static getPaymentConfirmationMessage(studentName: string, amount: number, feeType: string, schoolName: string): string {
    return `Payment confirmed for ${studentName} at ${schoolName}. Amount: GHS ${amount} for ${feeType}. Thank you!`;
  }

  static getAnnouncementMessage(title: string, content: string, schoolName: string): string {
    return `${schoolName} - ${title}: ${content}`;
  }

  static getEventNotificationMessage(eventTitle: string, eventDate: string, schoolName: string): string {
    return `${schoolName} Event: ${eventTitle} scheduled for ${eventDate}. Don't miss it!`;
  }

  static getAttendanceAlertMessage(studentName: string, date: string, schoolName: string): string {
    return `${schoolName}: ${studentName} was absent on ${date}. Please contact the school if this is unexpected.`;
  }

  static getExamReminderMessage(examTitle: string, examDate: string, studentName: string, schoolName: string): string {
    return `${schoolName}: Reminder for ${studentName} - ${examTitle} exam on ${examDate}. Good luck!`;
  }
}