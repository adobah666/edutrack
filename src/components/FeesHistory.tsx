'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

interface Fee {
  id: number;
  feeType: string;
  isOptional: boolean;
  totalAmount: number;
  totalPaid: number;
  remainingAmount: number;
  isPaid: boolean;
  dueDate: string;
  payments: {
    id: number;
    amount: number;
    paidDate: string;
  }[];
}

interface ClassFeesData {
  classId: number;
  className: string;
  period: string;
  isHistorical: boolean;
  startDate: string;
  endDate: string | null;
  fees: Fee[];
}

interface FeesHistoryProps {
  studentId: string;
}

const FeesHistory = ({ studentId }: FeesHistoryProps) => {
  const [classFeesHistory, setClassFeesHistory] = useState<ClassFeesData[]>([]);
  const [summary, setSummary] = useState({
    totalClasses: 0,
    totalFees: 0,
    totalPaid: 0,
    totalOutstanding: 0,
    mandatoryFeesTotal: 0,
    optionalFeesTotal: 0,
    mandatoryFeesPaid: 0,
    optionalFeesPaid: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [expandedClasses, setExpandedClasses] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetchFeesHistory();
  }, [studentId]);

  const fetchFeesHistory = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/student-fees-history?studentId=${studentId}`);
      
      if (response.ok) {
        const data = await response.json();
        setClassFeesHistory(data.classFeesHistory);
        setSummary(data.summary);
        // Expand current class by default
        const currentClass = data.classFeesHistory.find((c: ClassFeesData) => !c.isHistorical);
        if (currentClass) {
          setExpandedClasses(new Set([currentClass.classId]));
        }
      } else {
        toast.error('Failed to load fees history');
      }
    } catch (error) {
      console.error('Error fetching fees history:', error);
      toast.error('Failed to load fees history');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleClassExpansion = (classId: number) => {
    const newExpanded = new Set(expandedClasses);
    if (newExpanded.has(classId)) {
      newExpanded.delete(classId);
    } else {
      newExpanded.add(classId);
    }
    setExpandedClasses(newExpanded);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (classFeesHistory.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Fees History</h2>
        <div className="text-center py-12">
          <div className="bg-gray-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Fees History</h3>
          <p className="text-gray-500">No fees have been assigned to any of your classes yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Fees History</h2>
          <p className="text-gray-600 text-sm">View fees from all your classes</p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-500">Total Outstanding</div>
          <div className="text-2xl font-bold text-red-600">
            GH₵{summary.totalOutstanding.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="text-sm text-blue-600">Total Classes</div>
          <div className="text-xl font-semibold text-blue-900">{summary.totalClasses}</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-sm text-gray-600">Total Fees</div>
          <div className="text-xl font-semibold text-gray-900">GH₵{summary.totalFees.toFixed(2)}</div>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <div className="text-sm text-green-600">Total Paid</div>
          <div className="text-xl font-semibold text-green-900">GH₵{summary.totalPaid.toFixed(2)}</div>
        </div>
        <div className="bg-red-50 rounded-lg p-4">
          <div className="text-sm text-red-600">Outstanding</div>
          <div className="text-xl font-semibold text-red-900">GH₵{summary.totalOutstanding.toFixed(2)}</div>
        </div>
      </div>

      {/* Class Fees History */}
      <div className="space-y-4">
        {classFeesHistory.map((classData) => {
          const isExpanded = expandedClasses.has(classData.classId);
          const classTotalFees = classData.fees.reduce((sum, fee) => sum + fee.totalAmount, 0);
          const classTotalPaid = classData.fees.reduce((sum, fee) => sum + fee.totalPaid, 0);
          const classOutstanding = classData.fees.reduce((sum, fee) => sum + fee.remainingAmount, 0);

          return (
            <div key={classData.classId} className="border border-gray-200 rounded-lg">
              <button
                onClick={() => toggleClassExpansion(classData.classId)}
                className="w-full p-4 text-left hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${!classData.isHistorical ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{classData.className}</h3>
                      <p className="text-sm text-gray-600">{classData.period}</p>
                    </div>
                    {!classData.isHistorical && (
                      <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                        Current
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="text-right text-sm">
                      <div className="text-gray-500">Total: GH₵{classTotalFees.toFixed(2)}</div>
                      <div className="text-green-600">Paid: GH₵{classTotalPaid.toFixed(2)}</div>
                      {classOutstanding > 0 && (
                        <div className="text-red-600">Outstanding: GH₵{classOutstanding.toFixed(2)}</div>
                      )}
                    </div>
                    
                    <svg
                      className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </button>

              {isExpanded && (
                <div className="border-t border-gray-200 p-4">
                  <div className="space-y-3">
                    {classData.fees.map((fee) => (
                      <div key={fee.id} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="font-medium text-gray-900">{fee.feeType}</h4>
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                fee.isOptional
                                  ? 'bg-orange-100 text-orange-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}>
                                {fee.isOptional ? 'Optional' : 'Mandatory'}
                              </span>
                              {fee.isPaid ? (
                                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                                  ✓ Paid
                                </span>
                              ) : isOverdue(fee.dueDate) ? (
                                <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                                  Overdue
                                </span>
                              ) : (
                                <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
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
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FeesHistory;