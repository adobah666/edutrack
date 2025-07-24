"use client";

import Table from "@/components/Table";
import Image from "next/image";
import { useState } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

type TransactionList = {
  id: number;
  reference: string;
  description: string;
  amount: number;
  type: string;
  paymentMethod: string;
  date: Date;
  receiptNumber: string | null;
  mainAccount: {
    name: string;
    code: string;
    type: string;
  };
};

const columns = [
  {
    header: "Reference",
    accessor: "reference",
  },
  {
    header: "Description",
    accessor: "description",
  },
  {
    header: "Account",
    accessor: "account",
    className: "hidden md:table-cell",
  },
  {
    header: "Amount",
    accessor: "amount",
  },
  {
    header: "Type",
    accessor: "type",
    className: "hidden lg:table-cell",
  },
  {
    header: "Date",
    accessor: "date",
    className: "hidden lg:table-cell",
  },
  {
    header: "Actions",
    accessor: "action",
  },
];

const TransactionsTable = ({ data }: { data: TransactionList[] }) => {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState<number | null>(null);

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this transaction?")) {
      return;
    }

    setIsDeleting(id);
    try {
      const formData = new FormData();
      formData.append("id", id.toString());
      
      const response = await fetch("/api/transaction/delete", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success("Transaction deleted successfully!");
        router.refresh();
      } else {
        toast.error(result.message || "Failed to delete transaction");
      }
    } catch (error) {
      toast.error("An error occurred while deleting");
    } finally {
      setIsDeleting(null);
    }
  };

  const renderRow = (item: TransactionList) => (
    <tr
      key={item.id}
      className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
    >
      <td className="p-4 font-mono font-medium">{item.reference}</td>
      <td className="p-4">
        <div className="flex flex-col">
          <span className="font-medium">{item.description}</span>
          {item.receiptNumber && (
            <span className="text-xs text-gray-500">Receipt: {item.receiptNumber}</span>
          )}
        </div>
      </td>
      <td className="hidden md:table-cell p-4">
        <div className="flex flex-col">
          <span className="font-medium">{item.mainAccount.name}</span>
          <span className="text-xs text-gray-500">{item.mainAccount.code}</span>
        </div>
      </td>
      <td className="p-4">
        <span className={`font-medium ${
          item.type === "INCOME" ? "text-green-600" : "text-red-600"
        }`}>
          {item.type === "INCOME" ? "+" : "-"}GHS {item.amount.toLocaleString()}
        </span>
      </td>
      <td className="hidden lg:table-cell p-4">
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          item.type === "INCOME" ? "bg-green-100 text-green-800" : 
          item.type === "EXPENSE" ? "bg-red-100 text-red-800" :
          "bg-blue-100 text-blue-800"
        }`}>
          {item.type}
        </span>
      </td>
      <td className="hidden lg:table-cell p-4 text-sm text-gray-600">
        {new Intl.DateTimeFormat("en-GB").format(item.date)}
      </td>
      <td className="p-4">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => {/* Edit functionality can be added later */}}
            className="w-7 h-7 flex items-center justify-center rounded-full bg-lamaYellow"
            title="Edit Transaction"
          >
            <Image src="/update.png" alt="" width={16} height={16} />
          </button>
          <button 
            onClick={() => handleDelete(item.id)}
            disabled={isDeleting === item.id}
            className="w-7 h-7 flex items-center justify-center rounded-full bg-lamaPurple disabled:opacity-50"
            title="Delete Transaction"
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

export default TransactionsTable;