import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import SMSManagement from '@/components/SMSManagement';

const SMSPage = async () => {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  // Check if user is admin
  const admin = await prisma.admin.findUnique({
    where: { id: userId },
    include: { school: true }
  });

  if (!admin) redirect('/');

  // Get all students, parents, and teachers for SMS recipients
  const [students, parents, teachers] = await Promise.all([
    prisma.student.findMany({
      where: { schoolId: admin.schoolId },
      select: {
        id: true,
        name: true,
        phone: true,
        class: { select: { name: true } },
        parentStudents: {
          select: {
            parent: {
              select: {
                phone: true
              }
            }
          }
        }
      }
    }),
    prisma.parent.findMany({
      where: { schoolId: admin.schoolId },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        parentStudents: {
          select: {
            student: { select: { name: true, class: { select: { name: true } } } }
          }
        }
      }
    }),
    prisma.teacher.findMany({
      where: { schoolId: admin.schoolId },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        subjects: { select: { name: true } }
      }
    })
  ]);

  // Get SMS logs for tracking
  const smsLogs = await prisma.sMSLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50
  });

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">SMS Management</h1>
      <SMSManagement 
        students={students}
        parents={parents}
        teachers={teachers}
        smsLogs={smsLogs}
        schoolName={admin.school.name}
      />
    </div>
  );
};

export default SMSPage;