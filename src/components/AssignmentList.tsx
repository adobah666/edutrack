"use client";

import FormModal from "@/components/FormModal";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import { Assignment, Class, Subject, Teacher } from "@prisma/client";
import Image from "next/image";

type AssignmentList = Assignment & {
  subject: { name: string };
  class: { name: string };
  teacher: { name: string; surname: string };
};

interface AssignmentListProps {
  data: AssignmentList[];
  count: number;
  currentPage: number;
  userRole?: string;
  relatedData: {
    subjects: { id: number; name: string }[];
    classes: { id: number; name: string }[];
    teachers: { id: string; name: string; surname: string }[];
  };
}

export default function AssignmentList({ data, count, currentPage, userRole, relatedData }: AssignmentListProps) {
  const columns = [
    {
      header: "Assignment Name",
      accessor: "name",
    },
    {
      header: "Class",
      accessor: "class",
    },
    {
      header: "Teacher",
      accessor: "teacher",
      className: "hidden md:table-cell",
    },
    {
      header: "Due Date & Status",
      accessor: "dueDate",
      className: "hidden md:table-cell",
    },
    ...(userRole === "admin" || userRole === "teacher"
      ? [
          {
            header: "Actions",
            accessor: "action",
          },
        ]
      : []),
  ];
  
  const isOverdue = (dueDate: Date) => {
    return new Date(dueDate) < new Date();
  };

  const getStatusInfo = (dueDate: Date) => {
    const now = new Date();
    const due = new Date(dueDate);
    const timeDiff = due.getTime() - now.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

    if (daysDiff < 0) {
      return {
        status: 'Overdue',
        color: 'bg-red-100 text-red-800 border-red-200',
        rowColor: 'bg-red-50',
        textColor: 'text-red-900'
      };
    } else if (daysDiff === 0) {
      return {
        status: 'Due Today',
        color: 'bg-orange-100 text-orange-800 border-orange-200',
        rowColor: 'bg-orange-50',
        textColor: 'text-orange-900'
      };
    } else if (daysDiff <= 3) {
      return {
        status: `Due in ${daysDiff} day${daysDiff > 1 ? 's' : ''}`,
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        rowColor: 'bg-yellow-50',
        textColor: 'text-yellow-900'
      };
    } else {
      return {
        status: `Due in ${daysDiff} days`,
        color: 'bg-green-100 text-green-800 border-green-200',
        rowColor: 'bg-green-50',
        textColor: 'text-green-900'
      };
    }
  };

  const renderRow = (item: AssignmentList) => {
    const statusInfo = getStatusInfo(item.dueDate);
    
    return (
      <tr
        key={item.id}
        className={`border-b border-gray-200 text-sm hover:bg-lamaPurpleLight cursor-pointer ${statusInfo.rowColor}`}
        onClick={() => window.location.href = `/list/assignments/${item.id}`}
      >
        <td className="flex items-center gap-4 p-4">
          <div className="flex items-center gap-2">
            <span className={statusInfo.textColor}>{item.title}</span>
            <span className="text-xs text-gray-500">({item.subject.name})</span>
          </div>
        </td>
        <td className={statusInfo.textColor}>{item.class.name}</td>
        <td className={`hidden md:table-cell ${statusInfo.textColor}`}>
          {item.teacher.name + " " + item.teacher.surname}
        </td>
        <td className="hidden md:table-cell">
          <div className="flex flex-col gap-1">
            <span className={statusInfo.textColor}>
              {new Intl.DateTimeFormat("en-US").format(item.dueDate)}
            </span>
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${statusInfo.color}`}>
              {statusInfo.status}
            </span>
          </div>
        </td>
        <td onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-2">
            {(userRole === "admin" || userRole === "teacher") && (
              <>
                <FormModal table="assignment" type="update" data={item} relatedData={relatedData} />
                <FormModal table="assignment" type="delete" id={item.id} />
              </>
            )}
          </div>
        </td>
      </tr>
    );
  };

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      {/* TOP */}
      <div className="flex items-center justify-between">
        <h1 className="hidden md:block text-lg font-semibold">
          All Assignments
        </h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch />
          <div className="flex items-center gap-4 self-end">
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/filter.png" alt="" width={14} height={14} />
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/sort.png" alt="" width={14} height={14} />
            </button>
            {(userRole === "admin" || userRole === "teacher") && (
              <FormModal table="assignment" type="create" relatedData={relatedData} />
            )}
          </div>
        </div>
      </div>

      {/* STATUS LEGEND */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <span className="font-medium text-gray-700">Status Legend:</span>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-100 border border-green-200 rounded"></div>
            <span className="text-green-800">Active (4+ days)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-yellow-100 border border-yellow-200 rounded"></div>
            <span className="text-yellow-800">Due Soon (1-3 days)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-orange-100 border border-orange-200 rounded"></div>
            <span className="text-orange-800">Due Today</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-100 border border-red-200 rounded"></div>
            <span className="text-red-800">Overdue</span>
          </div>
        </div>
      </div>      {/* LIST */}
      <Table columns={columns} renderCustomRow={renderRow} data={data} />
      {/* PAGINATION */}
      <Pagination page={currentPage} count={count} />
    </div>
  );
}
