import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// This tells Next.js to fetch fresh data on every request
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const examId = searchParams.get('examId');

    if (!examId) {
      return NextResponse.json(
        { error: 'examId is required' },
        { status: 400 }
      );
    }

    // Find all results for this exam
    const results = await prisma.result.findMany({
      where: {
        examId: parseInt(examId)
      },
      select: {
        studentId: true
      }
    });

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error fetching exam results:', error);
    return NextResponse.json(
      { error: 'Failed to fetch exam results' },
      { status: 500 }
    );
  }
}
