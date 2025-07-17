"use client";

import { useState } from "react";
import Image from "next/image";
import ReceiptModal from "./ReceiptModal";

const ViewReceiptButton = ({ paymentId }: { paymentId: number }) => {
  const [loading, setLoading] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [paymentData, setPaymentData] = useState<any>(null);

  const handleViewReceipt = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/student-fees/${paymentId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch receipt data");
      }
      const data = await response.json();
      setPaymentData(data);
      setShowReceipt(true);
    } catch (error) {
      console.error("Error fetching receipt:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={handleViewReceipt}
        disabled={loading}
        className="flex items-center gap-2 text-lamaPurple hover:text-opacity-80"
      >
        <Image src="/view.png" alt="" width={18} height={18} />
        <span>View Receipt</span>
      </button>

      {showReceipt && paymentData && (
        <ReceiptModal
          payment={paymentData}
          onClose={() => {
            setShowReceipt(false);
            setPaymentData(null);
          }}
        />
      )}
    </>
  );
};

export default ViewReceiptButton;
