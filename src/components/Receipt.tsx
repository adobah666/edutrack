"use client";

import { formatDate } from "@/lib/utils";
import Image from "next/image";
import { forwardRef } from "react";

type ReceiptProps = {
  payment: {
    id: number;
    amount: number;
    paidDate: Date;
    student: {
      name: string;
      surname: string;
    };
    classFee: {
      amount: number;
      class: {
        name: string;
      };
      feeType: {
        name: string;
      };
    };
    totalPaidAmount?: number;
  };
  schoolInfo?: {
    name: string;
    address: string;
    phone: string;
    email: string;
    logo?: string;
  };
};

const Receipt = forwardRef<HTMLDivElement, ReceiptProps>(({ payment, schoolInfo = {
  name: "School Management System",
  address: "123 Education Street",
  phone: "+233 XX XXX XXXX",
  email: "info@school.com",
  logo: "/logo.png"
} }, ref) => {
  const receiptNumber = `RCP${payment.id.toString().padStart(6, "0")}`;
  const totalPaid = payment.totalPaidAmount || payment.amount;
  const balance = payment.classFee.amount - totalPaid;
  
  return (
    <div ref={ref} className="bg-white p-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>          <Image src={schoolInfo.logo || "/logo.png"} alt="School Logo" width={80} height={80} />
          <h1 className="text-2xl font-bold mt-2">{schoolInfo.name}</h1>
          <p className="text-gray-600">{schoolInfo.address}</p>
          <p className="text-gray-600">{schoolInfo.phone}</p>
          <p className="text-gray-600">{schoolInfo.email}</p>
        </div>
        <div className="text-right">
          <h2 className="text-xl font-semibold text-lamaPurple">RECEIPT</h2>
          <p className="text-gray-600 mt-1">#{receiptNumber}</p>
          <p className="text-gray-600">Date: {formatDate(payment.paidDate)}</p>
        </div>
      </div>

      {/* Student Info */}
      <div className="mb-8">
        <h3 className="text-gray-600 uppercase text-sm mb-2">PAID BY</h3>
        <p className="font-semibold">{payment.student.name} {payment.student.surname}</p>
        <p className="text-gray-600">Class: {payment.classFee.class.name}</p>
      </div>

      {/* Payment Details */}
      <div className="mb-8">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2">Description</th>
              <th className="text-right py-2">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="py-4">{payment.classFee.feeType.name}</td>
              <td className="text-right py-4">GH₵{payment.amount.toFixed(2)}</td>
            </tr>
          </tbody>
          <tfoot className="border-t">
            <tr>
              <th className="text-left py-4">This Payment</th>
              <th className="text-right py-4">GH₵{payment.amount.toFixed(2)}</th>
            </tr>
            <tr className="text-gray-600">
              <td className="py-2">Total Fee Amount</td>
              <td className="text-right py-2">GH₵{payment.classFee.amount.toFixed(2)}</td>
            </tr>
            <tr className="text-gray-600">
              <td className="py-2">Total Paid to Date</td>
              <td className="text-right py-2">GH₵{totalPaid.toFixed(2)}</td>
            </tr>
            <tr className="text-gray-600">
              <td className="py-2">Remaining Balance</td>
              <td className="text-right py-2">GH₵{balance.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Footer */}
      <div className="text-center text-gray-500 text-sm border-t pt-8">
        <p>Thank you for your payment!</p>
        <p className="mt-2">This is a computer-generated receipt. No signature is required.</p>
      </div>
    </div>
  );
});

Receipt.displayName = "Receipt";

export default Receipt;
