import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const [subjects, classes] = await Promise.all([
      prisma.subject.findMany({
        select: {
          id: true,
          name: true,
        },
        orderBy: {
          name: 'asc',
        },
      }),
      prisma.class.findMany({
        select: {
          id: true,
          name: true,
        },
        orderBy: {
          name: 'asc',
        },
      }),
    ]);

    return NextResponse.json({ subjects, classes });
  } catch (error) {
    console.error('Error fetching exam form data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch exam form data' },
      { status: 500 }
    );
  }
}
