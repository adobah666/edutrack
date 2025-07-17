import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';

export async function GET() {
  try {
    const { sessionClaims } = auth();
    const role = (sessionClaims?.metadata as { role?: string })?.role;

    if (role !== 'admin') {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 403 }
      );
    }

    const classes = await prisma.class.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    });

    return NextResponse.json(classes);
  } catch (error) {
    console.error('Error fetching classes:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500 }
    );
  }
}
