import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import SMSTestComponent from '@/components/SMSTestComponent';

const SMSTestPage = async () => {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  // Check if user is admin
  const admin = await prisma.admin.findUnique({
    where: { id: userId },
    include: { school: true }
  });

  if (!admin) redirect('/');

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">SMS Test</h1>
      <SMSTestComponent schoolName={admin.school.name} />
    </div>
  );
};

export default SMSTestPage;