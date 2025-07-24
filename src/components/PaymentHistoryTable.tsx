"use client";

import Table from "@/components/Table";
import Image from "next/image";
import { useState } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

type PaymentData = {
  id: number;
  amount: number;
  payPeriodStart: Date;
  payPeriodEnd: Date;
  dueDate: Date;
  payDate: Date | null;
  status: string;
  notes: string | null;
};

const columns = [
  {
    header: "Pay Period",
    accessor: "period",
  },
  {
    header: "Amount",
    accessor: "amount",
    className: "hidden md:table-cell",
  },
  {
    header: "Due Date",
    accessor: "dueDate",
    className: "hidden md:table-cell",
  },
  {
    header: "Pay Date",
    accessor: "payDate",
    className: "hidden lg:table-cell",
  },
  {
    header: "Status",
    accessor: "status",
  },
  {
    header: "Actions",
    accessor: "action",
  },
];

const PaymentHistoryTable = ({ 
  data, 
  currency 
}: { 
  data: PaymentData[];
  currency: string;
}) => {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const [isUpdating, setIsUpdating] = useState<number | null>(null);

  const handleMarkAsPaid = async (id: number) => {
    if (!confirm("Mark this payment as paid? This will set the pay date to today.")) {
      return;
    }

    setIsUpdating(id);
    try {
      const response = await fetch("/api/salary-payment/mark-paid", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success("Payment marked as paid successfully!");
        router.refresh();
      } else {
        toast.error(result.message || "Failed to mark payment as paid");
      }
    } catch (error) {
      toast.error("An error occurred while updating payment");
    } finally {
      setIsUpdating(null);
    }
  };

  const handleDeletePayment = async (id: number) => {
    if (!confirm("Are you sure you want to delete this payment record?")) {
      return;
    }

    setIsDeleting(id);
    try {
      const formData = new FormData();
      formData.append("id", id.toString());
      
      const response = await fetch("/api/salary-payment/delete", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success("Payment record deleted successfully!");
        router.refresh();
      } else {
        toast.error(result.message || "Failed to delete payment record");
      }
    } catch (error) {
      toast.error("An error occurred while deleting");
    } finally {
      setIsDeleting(null);
    }
  };

  const renderPaymentRow = (item: PaymentData) => (
    <tr
      key={item.id}
      className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
    >
      <td className="p-4">
        <div className="flex flex-col">
          <span className="font-medium">
            {new Intl.DateTimeFormat("en-GB").format(item.payPeriodStart)} - 
            {new Intl.DateTimeFormat("en-GB").format(item.payPeriodEnd)}
          </span>
        </div>
      </td>
      <td className="hidden md:table-cell">
        {currency} {item.amount.toLocaleString()}
      </td>
      <td className="hidden md:table-cell">
        <div className="flex flex-col">
          <span>{new Intl.DateTimeFormat("en-GB").format(item.dueDate)}</span>
          {item.status === "OVERDUE" && (
            <span className="text-xs text-red-600 font-medium">
              {Math.ceil((new Date().getTime() - item.dueDate.getTime()) / (1000 * 60 * 60 * 24))} days overdue
            </span>
          )}
        </div>
      </td>
      <td className="hidden lg:table-cell">
        {item.payDate ? new Intl.DateTimeFormat("en-GB").format(item.payDate) : "-"}
      </td>
      <td>
        <span className={`px-2 py-1 rounded-full text-xs ${
          item.status === "PAID" 
            ? "bg-green-100 text-green-800"
            : item.status === "PENDING"
            ? "bg-yellow-100 text-yellow-800"
            : "bg-red-100 text-red-800"
        }`}>
          {item.status}
        </span>
      </td>
      <td>
        <div className="flex items-center gap-2">
          {(item.status === "PENDING" || item.status === "OVERDUE") && (
            <button 
              onClick={() => handleMarkAsPaid(item.id)}
              disabled={isUpdating === item.id}
              className="w-7 h-7 flex items-center justify-center rounded-full bg-green-500 disabled:opacity-50"
              title="Mark as Paid"
            >
              {isUpdating === item.id ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Image src="/update.png" alt="" width={16} height={16} />
              )}
            </button>
          )}
          <button 
            onClick={() => handleDeletePayment(item.id)}
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

  return <Table columns={columns} renderCustomRow={renderPaymentRow} data={data} />;
};

export default PaymentHistoryTable;