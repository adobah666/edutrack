'use client';

import { useState } from 'react';
import PaystackPayment from './PaystackPayment';

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

interface Child {
  id: string;
  name: string;
  surname: string;
  className: string;
  fees: Fee[];
}

interface Parent {
  id: string;
  name: string;
  surname: string;
  email: string;
}

interface ParentFeesClientProps {
  parent: Parent;
  studentChildren: Child[];
}

const ParentFeesClient = ({ parent, studentChildren }: ParentFeesClientProps) => {
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedChild, setSelectedChild] = useState<string | null>(
    studentChildren.length > 0 ? studentChildren[0].id : null
  );

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

  const currentChild = studentChildren.find(child => child.id === selectedChild);

  // Calculate totals for all children
  const grandTotals = studentChildren.reduce((totals, child) => {
    const childTotals = child.fees.reduce((childSum, fee) => ({
      totalFees: childSum.totalFees + fee.totalAmount,
      totalPaid: childSum.totalPaid + fee.totalPaid,
      totalOutstanding: childSum.totalOutstanding + fee.remainingAmount
    }), { totalFees: 0, totalPaid: 0, totalOutstanding: 0 });

    return {
      totalFees: totals.totalFees + childTotals.totalFees,
      totalPaid: totals.totalPaid + childTotals.totalPaid,
      totalOutstanding: totals.totalOutstanding + childTotals.totalOutstanding
    };
  }, { totalFees: 0, totalPaid: 0, totalOutstanding: 0 });

  if (studentChildren.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
        <div className="text-gray-500 mb-2">No children found</div>
        <p className="text-sm text-gray-400">
          No children are associated with your account.
        </p>
      </div>
    );
  }

  return (
    <div key={refreshKey} className="space-y-6">
      {/* Parent Info and Grand Totals */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {parent.name} {parent.surname}
            </h2>
            <p className="text-gray-600">Parent Dashboard</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Total Outstanding (All Children)</div>
            <div className="text-2xl font-bold text-red-600">
              GH₵{grandTotals.totalOutstanding.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Grand Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-500">Total Fees (All Children)</div>
            <div className="text-xl font-semibold text-gray-900">
              GH₵{grandTotals.totalFees.toFixed(2)}
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-500">Total Paid</div>
            <div className="text-xl font-semibold text-green-600">
              GH₵{grandTotals.totalPaid.toFixed(2)}
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-500">Total Outstanding</div>
            <div className="text-xl font-semibold text-red-600">
              GH₵{grandTotals.totalOutstanding.toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      {/* Children Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {studentChildren.map((child) => {
              const childOutstanding = child.fees.reduce((sum, fee) => sum + fee.remainingAmount, 0);
              return (
                <button
                  key={child.id}
                  onClick={() => setSelectedChild(child.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                    selectedChild === child.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span>{child.name} {child.surname}</span>
                    {childOutstanding > 0 && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        GH₵{childOutstanding.toFixed(0)}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Selected Child's Fees */}
        {currentChild && (
          <div className="p-6">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                {currentChild.name} {currentChild.surname}
              </h3>
              <p className="text-gray-600">Class: {currentChild.className}</p>
            </div>

            {/* Child Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {(() => {
                const childTotals = currentChild.fees.reduce((sum, fee) => ({
                  totalFees: sum.totalFees + fee.totalAmount,
                  totalPaid: sum.totalPaid + fee.totalPaid,
                  totalOutstanding: sum.totalOutstanding + fee.remainingAmount
                }), { totalFees: 0, totalPaid: 0, totalOutstanding: 0 });

                return (
                  <>
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="text-sm text-blue-600">Total Fees</div>
                      <div className="text-xl font-semibold text-blue-900">
                        GH₵{childTotals.totalFees.toFixed(2)}
                      </div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4">
                      <div className="text-sm text-green-600">Amount Paid</div>
                      <div className="text-xl font-semibold text-green-900">
                        GH₵{childTotals.totalPaid.toFixed(2)}
                      </div>
                    </div>
                    <div className="bg-red-50 rounded-lg p-4">
                      <div className="text-sm text-red-600">Outstanding</div>
                      <div className="text-xl font-semibold text-red-900">
                        GH₵{childTotals.totalOutstanding.toFixed(2)}
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Fees List */}
            <div className="space-y-4">
              {currentChild.fees.map((fee) => (
                <div key={fee.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="text-lg font-medium text-gray-900">
                          {fee.feeType}
                        </h4>
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
                          <h5 className="text-sm font-medium text-gray-700 mb-2">Payment History</h5>
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
                            email={parent.email}
                            studentId={currentChild.id}
                            classFeeId={fee.id}
                            studentName={`${currentChild.name} ${currentChild.surname}`}
                            feeTypeName={fee.feeType}
                            className={currentChild.className}
                            onSuccess={handlePaymentSuccess}
                            allowPartialPayment={true}
                          />
                          <div className="text-xs text-gray-500 text-center">
                            Pay full amount or click &quot;Custom Amount&quot; for partial payment
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

              {currentChild.fees.length === 0 && (
                <div className="text-center py-8">
                  <div className="text-gray-500 mb-2">No fees assigned</div>
                  <p className="text-sm text-gray-400">
                    No fees have been assigned to this student&apos;s class yet.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ParentFeesClient;