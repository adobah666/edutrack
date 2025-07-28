import FormContainer from "@/components/FormContainer";
import SchedulePageClient from "@/components/SchedulePageClient";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { getSchoolFilter } from "@/lib/school-context";

const SchedulePage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const { sessionClaims } = auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  // Get school filter for current user
  const schoolFilter = await getSchoolFilter();

  // Fetch classes filtered by school
  const classes = await prisma.class.findMany({
    where: schoolFilter.schoolId ? { schoolId: schoolFilter.schoolId } : {},
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  // Get the selected class from query params or use the first class
  const selectedClassId = searchParams.classId ? parseInt(searchParams.classId) : classes[0]?.id;

  return (
    <div className="p-6 flex flex-col gap-6 bg-gray-50 min-h-screen">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-3 rounded-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Class Schedule Management</h1>
              <p className="text-gray-600 text-sm">Manage and view class schedules for all classes</p>
            </div>
          </div>
          {role === "admin" && (
            <div className="flex items-center gap-3">
              <FormContainer table="lesson" type="create" />
            </div>
          )}
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        {selectedClassId ? (
          <SchedulePageClient selectedClassId={selectedClassId} />
        ) : (
          <div className="text-center py-16">
            <div className="bg-gray-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Classes Available</h3>
            <p className="text-gray-500">Create some classes first to view their schedules</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SchedulePage;
