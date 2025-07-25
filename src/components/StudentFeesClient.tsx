'use client';

import { useState } from 'react';
import PaystackPayment from './PaystackPayment';
import { toast } from 'react-toastify';

interface Payment {
  id: number;
  amount: number;
  paidDate: Date;
}

interface Fee {
  id: number;
  feeType: string;
  totalAmount: number;
  totalPaid: number;
  remainingAmount: number;
  isPaid: boolean;
  dueDate: Date;
  payments: Payment[];
}

interface Student {
  id: string;
  name: string;
  surname: string;
  className: string;
  email: string;
}

interface StudentFeesClientProps {
  student: Student;
  fees: Fee[];
}

const StudentFeesClient = ({ student, fees }: StudentFeesClientProps) => {
  const [refreshKey, setRefreshKey] = useState(0);

  const handlePaymentSuccess = () => {
    setRefreshKey(prev => prev + 1);
    // Refresh the page to get updated data
    window.location.reload();
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const isOverdue = (dueDate: Date) => {
    return new Date(dueDate) < new Date();
  };

  const totalOutstanding = fees.reduce((sum, fee) => sum + fee.remainingAmount, 0);
  const totalPaid = fees.reduce((sum, fee) => sum + fee.totalPaid, 0);
  const totalFees = fees.reduce((sum, fee) => sum + fee.totalAmount, 0);

  return (
    <div key={refreshKey} className="space-y-6">
      {/* Student Info Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {student.name} {student.surname}
            </h2>
            <p className="text-gray-600">Class: {student.className}</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Total Outstanding</div>
            <div className="text-2xl font-bold text-red-600">
              GH₵{totalOutstanding.toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-500">Total Fees</div>
          <div className="text-xl font-semibold text-gray-900">
            GH₵{totalFees.toFixed(2)}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-500">Amount Paid</div>
          <div className="text-xl font-semibold text-green-600">
            GH₵{totalPaid.toFixed(2)}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-500">Outstanding</div>
          <div className="text-xl font-semibold text-red-600">
            GH₵{totalOutstanding.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Fees List */}
      <div className="space-y-4">
        {fees.map((fee) => (
          <div key={fee.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {fee.feeType}
                  </h3>
                  {fee.isPaid ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Paid
                    </span>
                  ) : isOverdue(fee.dueDate) ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      Overdue
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      Pending
                    </span>
                  )}
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Total Amount:</span>
                    <div className="font-medium">GH₵{fee.totalAmount.toFixed(2)}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Paid:</span>
                    <div className="font-medium text-green-600">GH₵{fee.totalPaid.toFixed(2)}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Outstanding:</span>
                    <div className="font-medium text-red-600">GH₵{fee.remainingAmount.toFixed(2)}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Due Date:</span>
                    <div className={`font-medium ${isOverdue(fee.dueDate) ? 'text-red-600' : 'text-gray-900'}`}>
                      {formatDate(fee.dueDate)}
                    </div>
                  </div>
                </div>

                {/* Payment History */}
                {fee.payments.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Payment History</h4>
                    <div className="space-y-1">
                      {fee.payments.map((payment) => (
                        <div key={payment.id} className="flex justify-between text-sm text-gray-600">
                          <span>Payment on {formatDate(payment.paidDate)}</span>
                          <span className="font-medium">GH₵{payment.amount.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Payment Button */}
              <div className="flex flex-col items-end gap-2">
                {!fee.isPaid && fee.remainingAmount > 0 && (
                  <>
                    <PaystackPayment
                      maxAmount={fee.remainingAmount}
                      email={student.email}
                      studentId={student.id}
                      classFeeId={fee.id}
                      studentName={`${student.name} ${student.surname}`}
                      feeTypeName={fee.feeType}
                      className={student.className}
                      onSuccess={handlePaymentSuccess}
                      allowPartialPayment={true}
                    />
                    <div className="text-xs text-gray-500 text-center">
                      Pay full amount or click "Custom Amount" for partial payment
                    </div>
                  </>
                )}
                {fee.isPaid && (
                  <div className="text-green-600 font-medium">
                    ✓ Fully Paid
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {fees.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <div className="text-gray-500 mb-2">No fees assigned</div>
          <p className="text-sm text-gray-400">
            No fees have been assigned to your class yet.
          </p>
        </div>
      )}
    </div>
  );
};

export default StudentFeesClient;