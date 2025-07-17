import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { sessionClaims } = auth();
    const role = (sessionClaims?.metadata as { role?: string })?.role;

    if (role !== 'admin') {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 403 }
      );
    }

    const id = parseInt(params.id);
    await prisma.lesson.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Lesson deleted successfully' });
  } catch (error) {
    console.error('Error deleting lesson:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500 }
    );
  }
}
