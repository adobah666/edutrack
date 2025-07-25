'use client';

import { useState } from 'react';

interface PaymentReceiptProps {
  payment: {
    id: number;
    amount: number;
    paidDate: Date;
    studentName: string;
    feeType: string;
    className: string;
    reference?: string;
  };
  onClose: () => void;
}

const PaymentReceipt = ({ payment, onClose }: PaymentReceiptProps) => {
  const [isPrinting, setIsPrinting] = useState(false);

  const handlePrint = () => {
    setIsPrinting(true);
    window.print();
    setTimeout(() => setIsPrinting(false), 1000);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
            <p className="text-gray-600">Your payment has been processed successfully</p>
          </div>

          {/* Receipt Details */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">Payment Receipt</h3>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Receipt ID:</span>
                <span className="font-medium">#{payment.id}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Student:</span>
                <span className="font-medium">{payment.studentName}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Class:</span>
                <span className="font-medium">{payment.className}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Fee Type:</span>
                <span className="font-medium">{payment.feeType}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Date:</span>
                <span className="font-medium">{formatDate(payment.paidDate)}</span>
              </div>
              
              {payment.reference && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Reference:</span>
                  <span className="font-medium text-xs">{payment.reference}</span>
                </div>
              )}
              
              <div className="border-t pt-2 mt-3">
                <div className="flex justify-between">
                  <span className="text-gray-900 font-semibold">Amount Paid:</span>
                  <span className="text-green-600 font-bold text-lg">GH₵{payment.amount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handlePrint}
              disabled={isPrinting}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50"
            >
              {isPrinting ? 'Printing...' : 'Print Receipt'}
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors duration-200"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentReceipt;