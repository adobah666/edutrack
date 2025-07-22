import FormModal from "@/components/FormModal";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import prisma from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { getCurrentUserSchool } from "@/lib/school-context";
import { Admin, Prisma } from "@prisma/client";
import Image from "next/image";
import { redirect } from "next/navigation";

type AdminList = Admin & {
  school?: {
    name: string;
  };
};

const columns = [
  {
    header: "Info",
    accessor: "info",
  },
  {
    header: "Role",
    accessor: "role",
    className: "hidden md:table-cell",
  },
  {
    header: "School",
    accessor: "school",
    className: "hidden md:table-cell",
  },
  {
    header: "Email",
    accessor: "email",
    className: "hidden lg:table-cell",
  },
  {
    header: "Actions",
    accessor: "action",
  },
];

const renderRow = (item: AdminList) => (
  <tr
    key={item.id}
    className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
  >
    <td className="flex items-center gap-4 p-4">
      <div className="flex flex-col">
        <h3 className="font-semibold">{item.name} {item.surname}</h3>
        <p className="text-xs text-gray-500">@{item.username}</p>
      </div>
    </td>
    <td className="hidden md:table-cell">
      <span className={`px-2 py-1 rounded-full text-xs ${
        item.role === "SUPER_ADMIN" 
          ? "bg-red-100 text-red-800" 
          : "bg-blue-100 text-blue-800"
      }`}>
        {item.role === "SUPER_ADMIN" ? "Super Admin" : "School Admin"}
      </span>
    </td>
    <td className="hidden md:table-cell">
      {item.school?.name || "All Schools"}
    </td>
    <td className="hidden lg:table-cell">{item.email || "N/A"}</td>
    <td>
      <div className="flex items-center gap-2">
        <FormModal table="admin" type="update" data={item} />
        <FormModal table="admin" type="delete" id={item.id} />
      </div>
    </td>
  </tr>
);

const AdminListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  // Check if user is super admin
  const userContext = await getCurrentUserSchool();
  if (!userContext.canAccessAllSchools) {
    redirect("/admin");
  }

  const { page, ...queryParams } = searchParams;
  const p = page ? parseInt(page) : 1;

  // URL PARAMS CONDITION
  const query: Prisma.AdminWhereInput = {};

  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined) {
        switch (key) {
          case "search":
            query.OR = [
              { name: { contains: value, mode: "insensitive" } },
              { surname: { contains: value, mode: "insensitive" } },
              { username: { contains: value, mode: "insensitive" } },
            ];
            break;
        }
      }
    }
  }

  const [data, count] = await prisma.$transaction([
    prisma.admin.findMany({
      where: query,
      include: {
        school: {
          select: {
            name: true,
          },
        },
      },
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
    }),
    prisma.admin.count({ where: query }),
  ]);

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      {/* TOP */}
      <div className="flex items-center justify-between">
        <h1 className="hidden md:block text-lg font-semibold">All Admins</h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch />
          <div className="flex items-center gap-4 self-end">
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/filter.png" alt="" width={14} height={14} />
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/sort.png" alt="" width={14} height={14} />
            </button>
            <FormModal table="admin" type="create" />
          </div>
        </div>
      </div>
      {/* LIST */}
      <Table columns={columns} renderRow={renderRow} data={data} />
      {/* PAGINATION */}
      <Pagination page={p} count={count} />
    </div>
  );
};

export default AdminListPage;