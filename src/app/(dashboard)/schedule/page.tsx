import FormContainer from "@/components/FormContainer";
import BigCalendarContainer from "@/components/BigCalendarContainer";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

const SchedulePage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const { sessionClaims } = auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  // Fetch all classes
  const classes = await prisma.class.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  // Get the selected class from query params or use the first class
  const selectedClassId = searchParams.classId ? parseInt(searchParams.classId) : classes[0]?.id;

  return (
    <div className="p-4 flex flex-col gap-4">
      <div className="flex items-center justify-between bg-white p-4 rounded-md">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold">Class Schedule Management</h1>
          {role === "admin" && (
            <FormContainer table="lesson" type="create" />
          )}
        </div>
      </div>
      <div className="bg-white p-4 rounded-md">
        {selectedClassId ? (
          <BigCalendarContainer 
            type="classId" 
            id={selectedClassId} 
            key={`calendar-${selectedClassId}-${Date.now()}`} // Add this line to force remount
          />
        ) : (
          <div className="text-center py-8 text-gray-500">No classes available</div>
        )}
      </div>
    </div>
  );
};

export default SchedulePage;
