"use client";

import Table from "@/components/Table";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

type PayrollList = {
  id: number;
  teacher: {
    id: string;
    name: string;
    surname: string;
    email: string | null;
  };
  baseSalary: number;
  currency: string;
  payFrequency: string;
  isActive: boolean;
  nextPayment?: {
    amount: number;
    dueDate: Date;
    status: string;
  } | null;
};

const columns = [
  {
    header: "Staff Info",
    accessor: "info",
  },
  {
    header: "Base Salary",
    accessor: "baseSalary",
    className: "hidden md:table-cell",
  },
  {
    header: "Pay Frequency",
    accessor: "payFrequency",
    className: "hidden md:table-cell",
  },
  {
    header: "Next Payment",
    accessor: "nextPayment",
    className: "hidden lg:table-cell",
  },
  {
    header: "Status",
    accessor: "status",
    className: "hidden lg:table-cell",
  },
  {
    header: "Actions",
    accessor: "action",
  },
];

const PayrollTable = ({ data }: { data: PayrollList[] }) => {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState<number | null>(null);

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this salary record?")) {
      return;
    }

    setIsDeleting(id);
    try {
      const formData = new FormData();
      formData.append("id", id.toString());
      
      const response = await fetch("/api/payroll/delete", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success("Salary record deleted successfully!");
        router.refresh();
      } else {
        toast.error(result.message || "Failed to delete salary record");
      }
    } catch (error) {
      toast.error("An error occurred while deleting");
    } finally {
      setIsDeleting(null);
    }
  };

  const renderRow = (item: PayrollList) => (
    <tr
      key={item.id}
      className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
    >
      <td className="flex items-center gap-4 p-4">
        <div className="flex flex-col">
          <h3 className="font-semibold">{item.teacher.name} {item.teacher.surname}</h3>
          <p className="text-xs text-gray-500">{item.teacher.email}</p>
        </div>
      </td>
      <td className="hidden md:table-cell">
        {item.currency} {item.baseSalary.toLocaleString()}
      </td>
      <td className="hidden md:table-cell">
        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
          {item.payFrequency}
        </span>
      </td>
      <td className="hidden lg:table-cell">
        {item.nextPayment ? (
          <div className="flex flex-col">
            <span className="font-medium">{item.currency} {item.nextPayment.amount.toLocaleString()}</span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">
                Due: {new Intl.DateTimeFormat("en-GB").format(item.nextPayment.dueDate)}
              </span>
              {item.nextPayment.status === "OVERDUE" && (
                <span className="text-xs text-red-600 font-medium">
                  ({Math.ceil((new Date().getTime() - item.nextPayment.dueDate.getTime()) / (1000 * 60 * 60 * 24))} days overdue)
                </span>
              )}
            </div>
          </div>
        ) : (
          <span className="text-gray-400">No pending payments</span>
        )}
      </td>
      <td className="hidden lg:table-cell">
        <span className={`px-2 py-1 rounded-full text-xs ${
          item.isActive 
            ? "bg-green-100 text-green-800" 
            : "bg-red-100 text-red-800"
        }`}>
          {item.isActive ? "Active" : "Inactive"}
        </span>
      </td>
      <td>
        <div className="flex items-center gap-2">
          <Link href={`/list/payroll/${item.id}`}>
            <button className="w-7 h-7 flex items-center justify-center rounded-full bg-lamaSky">
              <Image src="/view.png" alt="" width={16} height={16} />
            </button>
          </Link>
          <Link href={`/list/payroll/edit/${item.id}`}>
            <button className="w-7 h-7 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/update.png" alt="" width={16} height={16} />
            </button>
          </Link>
          <button 
            onClick={() => handleDelete(item.id)}
            disabled={isDeleting === item.id}
            className="w-7 h-7 flex items-center justify-center rounded-full bg-lamaPurple disabled:opacity-50"
          >
            {isDeleting === item.id ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Image src="/delete.png" alt="" width={16} height={16} />
            )}
          </button>
        </div>
      </td>
    </tr>
  );

  return <Table columns={columns} renderCustomRow={renderRow} data={data} />;
};

export default PayrollTable;