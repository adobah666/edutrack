"use client";

import { useRef } from "react";
import { useReactToPrint } from "react-to-print";
import Receipt from "./Receipt";
import Image from "next/image";

type ReceiptModalProps = {
  payment: any;
  onClose: () => void;
};

const ReceiptModal = ({ payment, onClose }: ReceiptModalProps) => {  const receiptRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
  content: () => receiptRef.current,
  documentTitle: `Receipt-${payment.id}`,
  pageStyle: "@page { size: A4; margin: 2cm }",
});

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full"
        >
          <Image src="/close.png" alt="Close" width={14} height={14} />
        </button>
        
        <div className="p-4">
          <Receipt ref={receiptRef} payment={payment} />
          
          <div className="flex justify-center mt-6 pb-4">
            <button
              onClick={handlePrint}
              className="bg-lamaPurple text-white px-6 py-2 rounded-md hover:bg-opacity-90 flex items-center gap-2"
            >
              <Image src="/print.png" alt="" width={20} height={20} />
              <span>Print Receipt</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceiptModal;
