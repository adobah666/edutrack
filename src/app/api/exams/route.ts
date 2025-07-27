import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';

export async function GET() {
  try {
    const { userId, sessionClaims } = auth();
    const role = (sessionClaims?.metadata as { role?: string })?.role;

    const query = role === "teacher" && userId
      ? {
          subject: {
            teachers: {
              some: {
                id: userId,
              },
            },
          },
        }
      : undefined;

    const exams = await prisma.exam.findMany({
      where: query,
      include: {
        subject: { 
          select: { 
            name: true 
          } 
        },
        class: { 
          select: { 
            name: true 
          } 
        },
        examClasses: {
          include: {
            class: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        startTime: "desc",
      },
    });

    return NextResponse.json(exams);
  } catch (error) {
    console.error('Error fetching exams:', error);
    return NextResponse.json(
      { error: 'Failed to fetch exams' },
      { status: 500 }
    );
  }
}
