"use client";

import FormModal from "./FormModal";
import { Admin } from "@prisma/client";

type AdminList = Admin & {
  school: {
    name: string;
  } | null;
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

const AdminTable = ({ 
  data, 
  schools 
}: { 
  data: AdminList[];
  schools: { id: string; name: string }[];
}) => {
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
          <FormModal table="admin" type="update" data={item} relatedData={{ schools }} />
          <FormModal table="admin" type="delete" id={item.id} />
        </div>
      </td>
    </tr>
  );

  return (
    <table className="w-full mt-4">
      <thead>
        <tr className="text-left text-gray-500 text-sm">
          {columns.map((col) => (
            <th key={col.accessor} className={col.className}>
              {col.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>{data.map(renderRow)}</tbody>
    </table>
  );
};

export default AdminTable;