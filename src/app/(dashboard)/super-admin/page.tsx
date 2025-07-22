import { getCurrentUserSchool } from "@/lib/school-context";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import Image from "next/image";
import Link from "next/link";

const SuperAdminPage = async () => {
  // Check if user is super admin
  const userContext = await getCurrentUserSchool();
  if (!userContext.canAccessAllSchools) {
    redirect("/admin");
  }

  // Get statistics
  const [schoolCount, adminCount, totalStudents, totalTeachers] = await Promise.all([
    prisma.school.count(),
    prisma.admin.count(),
    prisma.student.count(),
    prisma.teacher.count(),
  ]);

  const recentSchools = await prisma.school.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: {
          students: true,
          teachers: true,
          admins: true,
        },
      },
    },
  });

  return (
    <div className="p-4 flex gap-4 flex-col md:flex-row">
      {/* LEFT */}
      <div className="w-full lg:w-2/3 flex flex-col gap-8">
        {/* STATS CARDS */}
        <div className="flex gap-4 justify-between flex-wrap">
          <div className="bg-white p-4 rounded-md flex-1 min-w-[130px]">
            <div className="flex justify-between items-center">
              <span className="text-[10px] bg-blue-100 px-2 py-1 rounded-full text-blue-600">
                Total
              </span>
              <Image src="/school.png" alt="" width={20} height={20} />
            </div>
            <h1 className="text-2xl font-semibold my-4">{schoolCount}</h1>
            <h2 className="capitalize text-sm font-medium text-gray-500">Schools</h2>
          </div>

          <div className="bg-white p-4 rounded-md flex-1 min-w-[130px]">
            <div className="flex justify-between items-center">
              <span className="text-[10px] bg-purple-100 px-2 py-1 rounded-full text-purple-600">
                Total
              </span>
              <Image src="/profile.png" alt="" width={20} height={20} />
            </div>
            <h1 className="text-2xl font-semibold my-4">{adminCount}</h1>
            <h2 className="capitalize text-sm font-medium text-gray-500">Admins</h2>
          </div>

          <div className="bg-white p-4 rounded-md flex-1 min-w-[130px]">
            <div className="flex justify-between items-center">
              <span className="text-[10px] bg-green-100 px-2 py-1 rounded-full text-green-600">
                Total
              </span>
              <Image src="/student.png" alt="" width={20} height={20} />
            </div>
            <h1 className="text-2xl font-semibold my-4">{totalStudents}</h1>
            <h2 className="capitalize text-sm font-medium text-gray-500">Students</h2>
          </div>

          <div className="bg-white p-4 rounded-md flex-1 min-w-[130px]">
            <div className="flex justify-between items-center">
              <span className="text-[10px] bg-yellow-100 px-2 py-1 rounded-full text-yellow-600">
                Total
              </span>
              <Image src="/teacher.png" alt="" width={20} height={20} />
            </div>
            <h1 className="text-2xl font-semibold my-4">{totalTeachers}</h1>
            <h2 className="capitalize text-sm font-medium text-gray-500">Teachers</h2>
          </div>
        </div>

        {/* RECENT SCHOOLS */}
        <div className="bg-white p-4 rounded-md">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-lg font-semibold">Recent Schools</h1>
            <Link href="/list/schools" className="text-xs text-gray-400 hover:text-gray-600">
              View All
            </Link>
          </div>
          <div className="space-y-4">
            {recentSchools.map((school) => (
              <div key={school.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                <div className="flex items-center gap-3">
                  <Image
                    src={school.logo || "/noAvatar.png"}
                    alt=""
                    width={40}
                    height={40}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div>
                    <h3 className="font-medium">{school.name}</h3>
                    <p className="text-xs text-gray-500">{school.address}</p>
                  </div>
                </div>
                <div className="text-right text-xs text-gray-500">
                  <div>{school._count.students} Students</div>
                  <div>{school._count.teachers} Teachers</div>
                  <div>{school._count.admins} Admins</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT */}
      <div className="w-full lg:w-1/3 flex flex-col gap-8">
        {/* QUICK ACTIONS */}
        <div className="bg-white p-4 rounded-md">
          <h1 className="text-lg font-semibold mb-4">Quick Actions</h1>
          <div className="space-y-3">
            <Link
              href="/list/schools"
              className="flex items-center gap-3 p-3 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
            >
              <Image src="/school.png" alt="" width={20} height={20} />
              <span className="text-sm font-medium">Manage Schools</span>
            </Link>
            <Link
              href="/list/admins"
              className="flex items-center gap-3 p-3 bg-purple-50 rounded-md hover:bg-purple-100 transition-colors"
            >
              <Image src="/profile.png" alt="" width={20} height={20} />
              <span className="text-sm font-medium">Manage Admins</span>
            </Link>
          </div>
        </div>

        {/* SYSTEM INFO */}
        <div className="bg-white p-4 rounded-md">
          <h1 className="text-lg font-semibold mb-4">System Overview</h1>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total Schools:</span>
              <span className="text-sm font-medium">{schoolCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total Users:</span>
              <span className="text-sm font-medium">{adminCount + totalStudents + totalTeachers}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Active Admins:</span>
              <span className="text-sm font-medium">{adminCount}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminPage;