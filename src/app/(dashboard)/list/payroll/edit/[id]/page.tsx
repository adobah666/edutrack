import prisma from "@/lib/prisma";
import { requireSchoolAccess } from "@/lib/school-context";
import { notFound } from "next/navigation";
import StaffSalaryForm from "@/components/forms/StaffSalaryForm";

const EditPayrollPage = async ({
  params,
}: {
  params: { id: string };
}) => {
  const staffSalary = await prisma.staffSalary.findUnique({
    where: {
      id: parseInt(params.id),
    },
    include: {
      teacher: {
        select: {
          id: true,
          name: true,
          surname: true,
        },
      },
    },
  });

  if (!staffSalary) {
    notFound();
  }

  // Check school access
  await requireSchoolAccess(staffSalary.schoolId);

  // Get all teachers for the dropdown (in case admin wants to change assignment)
  const teachers = await prisma.teacher.findMany({
    where: {
      schoolId: staffSalary.schoolId,
    },
    select: { id: true, name: true, surname: true },
    orderBy: [{ name: "asc" }, { surname: "asc" }]
  });

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-semibold">
          Edit Salary for {staffSalary.teacher.name} {staffSalary.teacher.surname}
        </h1>
      </div>
      
      <StaffSalaryForm
        type="update"
        data={staffSalary}
        relatedData={{ teachers }}
      />
    </div>
  );
};

export default EditPayrollPage;