"use client";

import FormModal from "./FormModal";
import Image from "next/image";
import { School } from "@prisma/client";

type SchoolList = School & {
  _count: {
    students: number;
    teachers: number;
    admins: number;
  };
};

const columns = [
  {
    header: "Info",
    accessor: "info",
  },
  {
    header: "Students",
    accessor: "students",
    className: "hidden md:table-cell",
  },
  {
    header: "Teachers", 
    accessor: "teachers",
    className: "hidden md:table-cell",
  },
  {
    header: "Admins",
    accessor: "admins", 
    className: "hidden md:table-cell",
  },
  {
    header: "Actions",
    accessor: "action",
  },
];

const SchoolTable = ({ data }: { data: SchoolList[] }) => {
  const renderRow = (item: SchoolList) => (
    <tr
      key={item.id}
      className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
    >
      <td className="flex items-center gap-4 p-4">
        <Image
          src={item.logo || "/noAvatar.png"}
          alt=""
          width={40}
          height={40}
          className="md:hidden xl:block w-10 h-10 rounded-full object-cover"
        />
        <div className="flex flex-col">
          <h3 className="font-semibold">{item.name}</h3>
          <p className="text-xs text-gray-500">{item.address}</p>
        </div>
      </td>
      <td className="hidden md:table-cell">{item._count.students}</td>
      <td className="hidden md:table-cell">{item._count.teachers}</td>
      <td className="hidden md:table-cell">{item._count.admins}</td>
      <td>
        <div className="flex items-center gap-2">
          <FormModal table="school" type="update" data={item} />
          <FormModal table="school" type="delete" id={item.id} />
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

export default SchoolTable;