"use client";

import Table from "@/components/Table";
import Image from "next/image";
import { useState } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

type AccountList = {
  id: number;
  code: string;
  name: string;
  type: string;
  subType: string;
  description: string | null;
  isActive: boolean;
  _count: {
    transactions: number;
  };
};

const columns = [
  {
    header: "Account Code",
    accessor: "code",
  },
  {
    header: "Account Name",
    accessor: "name",
  },
  {
    header: "Type",
    accessor: "type",
    className: "hidden md:table-cell",
  },
  {
    header: "Sub Type",
    accessor: "subType",
    className: "hidden lg:table-cell",
  },
  {
    header: "Transactions",
    accessor: "transactions",
    className: "hidden lg:table-cell",
  },
  {
    header: "Status",
    accessor: "status",
    className: "hidden md:table-cell",
  },
  {
    header: "Actions",
    accessor: "action",
  },
];

const AccountsTable = ({ data }: { data: AccountList[] }) => {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState<number | null>(null);

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this account?")) {
      return;
    }

    setIsDeleting(id);
    try {
      const formData = new FormData();
      formData.append("id", id.toString());
      
      const response = await fetch("/api/account/delete", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success("Account deleted successfully!");
        router.refresh();
      } else {
        toast.error(result.message || "Failed to delete account");
      }
    } catch (error) {
      toast.error("An error occurred while deleting");
    } finally {
      setIsDeleting(null);
    }
  };

  const renderRow = (item: AccountList) => (
    <tr
      key={item.id}
      className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
    >
      <td className="p-4 font-mono font-medium">{item.code}</td>
      <td className="p-4">
        <div className="flex flex-col">
          <span className="font-medium">{item.name}</span>
          {item.description && (
            <span className="text-xs text-gray-500">{item.description}</span>
          )}
        </div>
      </td>
      <td className="hidden md:table-cell p-4">
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          item.type === "ASSET" ? "bg-blue-100 text-blue-800" :
          item.type === "LIABILITY" ? "bg-red-100 text-red-800" :
          item.type === "EQUITY" ? "bg-purple-100 text-purple-800" :
          item.type === "INCOME" ? "bg-green-100 text-green-800" :
          "bg-orange-100 text-orange-800"
        }`}>
          {item.type}
        </span>
      </td>
      <td className="hidden lg:table-cell p-4 text-xs text-gray-600">
        {item.subType.replace(/_/g, " ")}
      </td>
      <td className="hidden lg:table-cell p-4">
        <span className="text-sm font-medium">{item._count.transactions}</span>
      </td>
      <td className="hidden md:table-cell p-4">
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          item.isActive 
            ? "bg-green-100 text-green-800" 
            : "bg-gray-100 text-gray-800"
        }`}>
          {item.isActive ? "Active" : "Inactive"}
        </span>
      </td>
      <td className="p-4">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => {/* Edit functionality can be added later */}}
            className="w-7 h-7 flex items-center justify-center rounded-full bg-lamaYellow"
            title="Edit Account"
          >
            <Image src="/update.png" alt="" width={16} height={16} />
          </button>
          {item._count.transactions === 0 && (
            <button 
              onClick={() => handleDelete(item.id)}
              disabled={isDeleting === item.id}
              className="w-7 h-7 flex items-center justify-center rounded-full bg-lamaPurple disabled:opacity-50"
              title="Delete Account"
            >
              {isDeleting === item.id ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Image src="/delete.png" alt="" width={16} height={16} />
              )}
            </button>
          )}
        </div>
      </td>
    </tr>
  );

  return <Table columns={columns} renderCustomRow={renderRow} data={data} />;
};

export default AccountsTable;