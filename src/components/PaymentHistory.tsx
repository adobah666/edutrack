'use client';

import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import Receipt from './Receipt';
import { useReactToPrint } from 'react-to-print';

interface Payment {
  id: number;
  amount: number;
  paidDate: string;
  classFee: {
    id: number;
    amount: number;
    class: {
      id: number;
      name: string;
    };
    feeType: {
      id: number;
      name: string;
      isOptional: boolean;
    };
  };
  student: {
    id: string;
    name: string;
    surname: string;
  };
}

interface PaymentHistoryProps {
  studentId: string;
}

const PaymentHistory = ({ studentId }: PaymentHistoryProps) => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [groupedPayments, setGroupedPayments] = useState<Record<string, Payment[]>>({});
  const [summary, setSummary] = useState({
    totalPayments: 0,
    totalPaid: 0,
    totalMandatoryPaid: 0,
    totalOptionalPaid: 0,
    mandatoryPayments: 0,
    optionalPayments: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'mandatory' | 'optional'>('all');
  const receiptRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    content: () => receiptRef.current,
    documentTitle: `Receipt-${selectedPayment?.id}`,
  });

  useEffect(() => {
    fetchPaymentHistory();
  }, [studentId]);

  const fetchPaymentHistory = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/student-payment-history?studentId=${studentId}`);
      
      if (response.ok) {
        const data = await response.json();
        setPayments(data.payments);
        setGroupedPayments(data.groupedPayments);
        setSummary(data.summary);
      } else {
        toast.error('Failed to load payment history');
      }
    } catch (error) {
      console.error('Error fetching payment history:', error);
      toast.error('Failed to load payment history');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFilteredPayments = () => {
    switch (activeTab) {
      case 'mandatory':
        return payments.filter(p => !p.classFee.feeType.isOptional);
      case 'optional':
        return payments.filter(p => p.classFee.feeType.isOptional);
      default:
        return payments;
    }
  };

  const getFilteredGroupedPayments = () => {
    const filtered = getFilteredPayments();
    return filtered.reduce((acc, payment) => {
      const className = payment.classFee.class.name;
      if (!acc[className]) {
        acc[className] = [];
      }
      acc[className].push(payment);
      return acc;
    }, {} as Record<string, Payment[]>);
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (payments.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Payment History</h2>
        <div className="text-center py-12">
          <div className="bg-gray-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Payment History</h3>
          <p className="text-gray-500">You haven't made any payments yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Payment History</h2>
          <p className="text-gray-600 text-sm">View all your payment records and download receipts</p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-500">Total Paid</div>
          <div className="text-2xl font-bold text-green-600">
            GH₵{summary.totalPaid.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="text-sm text-blue-600">Total Payments</div>
          <div className="text-xl font-semibold text-blue-900">{summary.totalPayments}</div>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <div className="text-sm text-green-600">Total Amount</div>
          <div className="text-xl font-semibold text-green-900">GH₵{summary.totalPaid.toFixed(2)}</div>
        </div>
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="text-sm text-purple-600">Mandatory Fees</div>
          <div className="text-xl font-semibold text-purple-900">GH₵{summary.totalMandatoryPaid.toFixed(2)}</div>
        </div>
        <div className="bg-orange-50 rounded-lg p-4">
          <div className="text-sm text-orange-600">Optional Fees</div>
          <div className="text-xl font-semibold text-orange-900">GH₵{summary.totalOptionalPaid.toFixed(2)}</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8" aria-label="Tabs">
          {[
            { key: 'all', label: 'All Payments', count: summary.totalPayments },
            { key: 'mandatory', label: 'Mandatory', count: summary.mandatoryPayments },
            { key: 'optional', label: 'Optional', count: summary.optionalPayments }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </nav>
      </div>

      {/* Payment List by Class */}
      <div className="space-y-6">
        {Object.entries(getFilteredGroupedPayments()).map(([className, classPayments]) => (
          <div key={className}>
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              {className}
              <span className="text-sm text-gray-500">
                ({classPayments.length} payment{classPayments.length !== 1 ? 's' : ''})
              </span>
            </h3>
            
            <div className="space-y-2">
              {classPayments.map((payment) => (
                <div key={payment.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-medium text-gray-900">{payment.classFee.feeType.name}</h4>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          payment.classFee.feeType.isOptional
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {payment.classFee.feeType.isOptional ? 'Optional' : 'Mandatory'}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Amount Paid:</span>
                          <div className="text-green-600 font-semibold">GH₵{payment.amount.toFixed(2)}</div>
                        </div>
                        <div>
                          <span className="font-medium">Payment Date:</span>
                          <div>{formatDate(payment.paidDate)}</div>
                        </div>
                        <div>
                          <span className="font-medium">Receipt ID:</span>
                          <div>#{payment.id}</div>
                        </div>
                      </div>
                    </div>

                    <div className="ml-4">
                      <button
                        onClick={() => setSelectedPayment(payment)}
                        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        View Receipt
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Receipt Modal */}
      {selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Payment Receipt</h3>
                <div className="flex gap-2">
                  <button
                    onClick={handlePrint}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    Print
                  </button>
                  <button
                    onClick={() => setSelectedPayment(null)}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                  >
                    Close
                  </button>
                </div>
              </div>
              
              <Receipt
                ref={receiptRef}
                payment={{
                  ...selectedPayment,
                  paidDate: new Date(selectedPayment.paidDate)
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentHistory;