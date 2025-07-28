"use client";

import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import PaystackPayment from './PaystackPayment';

interface OptionalFee {
  id: number;
  name: string;
  description?: string;
  isOptional: boolean;
  classFees: {
    id: number;
    amount: number;
    dueDate: string;
    classId: number;
    class: {
      name: string;
    };
  }[];
}

interface OptInRecord {
  id: number;
  studentId: string;
  feeTypeId: number;
  classId: number;
  optedInAt: string;
  feeType: {
    id: number;
    name: string;
    description?: string;
  };
  class: {
    id: number;
    name: string;
  };
}

interface OptionalFeesManagerProps {
  studentId: string;
  currentClassId: number;
  isParentView?: boolean;
  studentName?: string;
  studentEmail?: string;
  className?: string;
}

const OptionalFeesManager = ({ 
  studentId, 
  currentClassId, 
  isParentView = false,
  studentName = '',
  studentEmail = '',
  className = ''
}: OptionalFeesManagerProps) => {
  const [optionalFees, setOptionalFees] = useState<OptionalFee[]>([]);
  const [studentOptIns, setStudentOptIns] = useState<OptInRecord[]>([]);
  const [optedInFees, setOptedInFees] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState<number | null>(null);

  // Fetch optional fees and student opt-ins
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        const [feesRes, optInsRes, studentFeesRes] = await Promise.all([
          fetch('/api/fee-types'),
          fetch(`/api/student-fee-opt-ins?studentId=${studentId}`),
          fetch(`/api/student-fees?studentId=${studentId}`)
        ]);

        if (feesRes.ok) {
          const allFees = await feesRes.json();
          // Filter only optional fees that have class fees for the current class
          const optionalFeesWithClassFees = allFees
            .filter((fee: any) => fee.isOptional)
            .map((fee: any) => ({
              ...fee,
              classFees: fee.classFees?.filter((cf: any) => cf.classId === currentClassId) || []
            }))
            .filter((fee: any) => fee.classFees.length > 0);
          
          setOptionalFees(optionalFeesWithClassFees);
        }

        if (optInsRes.ok) {
          const optIns = await optInsRes.json();
          setStudentOptIns(optIns);
        }

        // Get student's fee payments for opted-in optional fees
        if (studentFeesRes.ok) {
          const studentFees = await studentFeesRes.json();
          setOptedInFees(studentFees.filter((fee: any) => fee.classFee?.feeType?.isOptional));
        }
      } catch (error) {
        console.error('Error fetching optional fees:', error);
        toast.error('Failed to load optional fees');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [studentId, currentClassId]);

  const isOptedIn = (feeTypeId: number) => {
    return studentOptIns.some(optIn => 
      optIn.feeTypeId === feeTypeId && optIn.classId === currentClassId
    );
  };

  const handleOptIn = async (feeTypeId: number) => {
    setIsProcessing(feeTypeId);
    try {
      const response = await fetch('/api/student-fee-opt-ins', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId,
          feeTypeId,
          classId: currentClassId
        }),
      });

      if (response.ok) {
        const newOptIn = await response.json();
        setStudentOptIns(prev => [...prev, newOptIn]);
        toast.success('Successfully opted in to fee!');
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to opt in to fee');
      }
    } catch (error) {
      console.error('Error opting in to fee:', error);
      toast.error('Failed to opt in to fee');
    } finally {
      setIsProcessing(null);
    }
  };

  const handleOptOut = async (feeTypeId: number) => {
    setIsProcessing(feeTypeId);
    try {
      const response = await fetch(
        `/api/student-fee-opt-ins?studentId=${studentId}&feeTypeId=${feeTypeId}&classId=${currentClassId}`,
        {
          method: 'DELETE',
        }
      );

      if (response.ok) {
        setStudentOptIns(prev => 
          prev.filter(optIn => !(optIn.feeTypeId === feeTypeId && optIn.classId === currentClassId))
        );
        toast.success('Successfully opted out of fee!');
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to opt out of fee');
      }
    } catch (error) {
      console.error('Error opting out of fee:', error);
      toast.error('Failed to opt out of fee');
    } finally {
      setIsProcessing(null);
    }
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

  if (optionalFees.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Optional Fees</h2>
        <div className="text-center py-8">
          <div className="bg-gray-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Optional Fees Available</h3>
          <p className="text-gray-500">There are currently no optional fees available for your class.</p>
        </div>
      </div>
    );
  }

  // Calculate totals for opted-in fees
  const optedInFeesForClass = studentOptIns.filter(optIn => optIn.classId === currentClassId);
  const totalOptionalAmount = optedInFeesForClass.reduce((sum, optIn) => {
    const fee = optionalFees.find(f => f.id === optIn.feeTypeId);
    return sum + (fee?.classFees[0]?.amount || 0);
  }, 0);

  const totalOptionalPaid = optedInFees.reduce((sum, fee) => sum + fee.amount, 0);
  const totalOptionalOutstanding = totalOptionalAmount - totalOptionalPaid;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Optional Fees</h2>
          <p className="text-gray-600 text-sm">
            {isParentView ? 'Choose optional fees for your child' : 'Choose optional fees you want to participate in'}
          </p>
        </div>
        <div className="flex gap-3">
          <div className="bg-blue-50 px-3 py-1 rounded-full">
            <span className="text-blue-700 text-sm font-medium">
              {optedInFeesForClass.length} opted in
            </span>
          </div>
          {totalOptionalOutstanding > 0 && (
            <div className="bg-orange-50 px-3 py-1 rounded-full">
              <span className="text-orange-700 text-sm font-medium">
                GH₵{totalOptionalOutstanding.toFixed(2)} outstanding
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Optional Fees Summary */}
      {optedInFeesForClass.length > 0 && (
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-3">Optional Fees Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">GH₵{totalOptionalAmount.toFixed(2)}</div>
              <div className="text-blue-700">Total Optional Fees</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">GH₵{totalOptionalPaid.toFixed(2)}</div>
              <div className="text-green-700">Amount Paid</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">GH₵{totalOptionalOutstanding.toFixed(2)}</div>
              <div className="text-orange-700">Optional Outstanding</div>
            </div>
          </div>
          {totalOptionalOutstanding > 0 && (
            <div className="mt-3 p-3 bg-orange-100 rounded-lg border border-orange-200">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span className="text-orange-800 font-medium">
                  You have GH₵{totalOptionalOutstanding.toFixed(2)} in unpaid optional fees
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Opted-in Fees (with payment options) */}
      {optedInFeesForClass.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Optional Fees (Payment Required)</h3>
          <div className="space-y-3">
            {optedInFeesForClass.map((optIn) => {
              const fee = optionalFees.find(f => f.id === optIn.feeTypeId);
              if (!fee) return null;
              
              const classFee = fee.classFees[0];
              const paidAmount = optedInFees
                .filter(pf => pf.classFee?.feeTypeId === fee.id)
                .reduce((sum, pf) => sum + pf.amount, 0);
              const outstanding = classFee.amount - paidAmount;
              const isPaid = outstanding <= 0;

              return (
                <div key={optIn.id} className="border border-green-200 bg-green-50 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-semibold text-gray-900">{fee.name}</h4>
                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                          ✓ Opted In
                        </span>
                        {isPaid && (
                          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                            ✓ Paid
                          </span>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Total Amount:</span>
                          <div className="font-medium">GH₵{classFee.amount.toFixed(2)}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Paid:</span>
                          <div className="font-medium text-green-600">GH₵{paidAmount.toFixed(2)}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Outstanding:</span>
                          <div className={`font-medium ${outstanding > 0 ? 'text-red-600' : 'text-green-600'}`}>
                            GH₵{outstanding.toFixed(2)}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-600">Due Date:</span>
                          <div className="font-medium">{new Date(classFee.dueDate).toLocaleDateString()}</div>
                        </div>
                      </div>
                    </div>

                    <div className="ml-4 flex flex-col gap-2">
                      {!isPaid && outstanding > 0 && (
                        <PaystackPayment
                          maxAmount={outstanding}
                          email={studentEmail}
                          studentId={studentId}
                          classFeeId={classFee.id}
                          studentName={studentName}
                          feeTypeName={fee.name}
                          className={className}
                          onSuccess={() => {
                            // Refresh the data after successful payment
                            toast.success('Payment successful! Refreshing data...');
                            setTimeout(() => {
                              window.location.reload();
                            }, 1000);
                          }}
                          allowPartialPayment={true}
                        />
                      )}
                      <button
                        onClick={() => handleOptOut(fee.id)}
                        disabled={isProcessing === fee.id}
                        className="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:opacity-50 text-sm"
                        title="Opt out of this fee"
                      >
                        Opt Out
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Available Optional Fees (to opt into) */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Available Optional Fees {optedInFeesForClass.length > 0 ? '(Not Yet Opted In)' : ''}
        </h3>
        {optionalFees.filter(fee => !isOptedIn(fee.id)).map((fee) => {
          const classFee = fee.classFees[0]; // Should only be one for current class
          const processing = isProcessing === fee.id;

          return (
            <div key={fee.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-semibold text-gray-900">{fee.name}</h4>
                    <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full">
                      Optional
                    </span>
                  </div>
                  
                  {fee.description && (
                    <p className="text-gray-600 text-sm mb-3">{fee.description}</p>
                  )}
                  
                  <div className="flex items-center gap-4 text-sm">
                    <span className="font-medium text-gray-900">
                      Amount: GH₵{classFee.amount.toFixed(2)}
                    </span>
                    <span className="text-gray-500">
                      Due: {new Date(classFee.dueDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="ml-4">
                  <button
                    onClick={() => handleOptIn(fee.id)}
                    disabled={processing}
                    className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {processing && (
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    )}
                    {processing ? 'Processing...' : 'Opt In'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        
        {optionalFees.filter(fee => !isOptedIn(fee.id)).length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>You have opted into all available optional fees for your class.</p>
          </div>
        )}
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div>
            <h4 className="font-medium text-blue-900 mb-1">About Optional Fees</h4>
            <p className="text-blue-800 text-sm">
              Optional fees are additional services or activities you can choose to participate in. 
              You can opt in or out at any time before the due date. Only fees you opt into will be added to your total bill.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OptionalFeesManager;