import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { SMSService } from '@/lib/sms-service';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { to, content, from, type, recipientId } = body;

    if (!to || !content) {
      return NextResponse.json({ error: 'Phone number and content are required' }, { status: 400 });
    }

    // Send SMS
    const result = await SMSService.sendSMS(to, content, from);

    // Log SMS in database for tracking
    if (result.success) {
      await prisma.sMSLog.create({
        data: {
          phoneNumber: to,
          content,
          type: type || 'MANUAL',
          status: 'SENT',
          sentBy: userId,
          recipientId,
          messageId: result.messageId,
        },
      });
    } else {
      await prisma.sMSLog.create({
        data: {
          phoneNumber: to,
          content,
          type: type || 'MANUAL',
          status: 'FAILED',
          sentBy: userId,
          recipientId,
          errorMessage: result.message,
        },
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('SMS API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}