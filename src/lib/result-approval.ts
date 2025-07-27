import prisma from '@/lib/prisma';

export async function checkResultApproval(classId: number, term: string, schoolId: string): Promise<boolean> {
  try {
    const approval = await prisma.resultApproval.findUnique({
      where: {
        classId_term_schoolId: {
          classId: classId,
          term: term as any,
          schoolId: schoolId,
        },
      },
    });

    return approval?.isApproved || false;
  } catch (error) {
    console.error('Error checking result approval:', error);
    return false; // Default to not approved if there's an error
  }
}