'use client';

import React, { useState } from 'react';
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

  // Update selected child when studentChildren changes (for single child mode)
  React.useEffect(() => {
    if (studentChildren.length === 1) {
      setSelectedChild(studentChildren[0].id);
    } else if (studentChildren.length > 0 && !selectedChild) {
      setSelectedChild(studentChildren[0].id);
    }
  }, [studentChildren, selectedChild]);

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
      {/* Parent Info */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {parent.name} {parent.surname}
            </h2>
            <p className="text-gray-600">Parent Dashboard - Select a child to view their fees</p>
          </div>
        </div>
      </div>

      {/* Children Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {studentChildren.map((child) => (
              <button
                key={child.id}
                onClick={() => setSelectedChild(child.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${selectedChild === child.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                {child.name} {child.surname}
                <span className="ml-2 text-xs text-gray-400">({child.className})</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Selected Child's Fees */}
        {currentChild ? (
          <div className="p-6">
            <div className="mb-6">
              {/* Child Summary Cards */}
              {(() => {
                const childTotals = currentChild.fees.reduce((totals, fee) => ({
                  totalFees: totals.totalFees + fee.totalAmount,
                  totalPaid: totals.totalPaid + fee.totalPaid,
                  totalOutstanding: totals.totalOutstanding + fee.remainingAmount
                }), { totalFees: 0, totalPaid: 0, totalOutstanding: 0 });

                return (
                  <>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      {currentChild.name} {currentChild.surname} - {currentChild.className}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Fees List */}
            <div key={currentChild.id} className="space-y-4">
              {currentChild.fees.map((fee) => (
                <div key={`${currentChild.id}-${fee.id}`} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-gray-900">{fee.feeType}</h4>
                        {fee.isPaid ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Paid
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
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
                      {fee.payments && fee.payments.length > 0 && (
                        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
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

                    {/* Payment Button - Always Visible */}
                    <div className="flex flex-col items-end gap-2 min-w-[200px]">
                      {fee.isPaid ? (
                        <div className="text-green-600 font-medium text-center py-2">
                          ✓ Fully Paid
                        </div>
                      ) : fee.remainingAmount > 0 ? (
                        <div className="w-full">
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
                          <div className="text-xs text-gray-500 text-center mt-1">
                            Pay full amount or click &quot;Custom Amount&quot; for partial payment
                          </div>
                        </div>
                      ) : (
                        <div className="text-gray-500 font-medium text-center py-2">
                          No Payment Required
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {currentChild.fees.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-lg">No fees found for this student.</p>
                  <p className="text-sm mt-2">All fees have been paid or no fees have been assigned yet.</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="p-6 text-center text-gray-500">
            <p>Please select a child to view their fees.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ParentFeesClient;