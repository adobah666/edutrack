'use client';

import { useState } from 'react';
import ParentFeesClient from './ParentFeesClient';
import OptionalFeesManager from './OptionalFeesManager';
import PaymentHistory from './PaymentHistory';
import FeesHistory from './FeesHistory';

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
  classId: number;
  fees: Fee[];
}

interface Parent {
  id: string;
  name: string;
  surname: string;
  email: string;
}

interface ParentFeesPageClientProps {
  parent: Parent;
  studentChildren: Child[];
}

const ParentFeesPageClient = ({ parent, studentChildren }: ParentFeesPageClientProps) => {
  const [activeTab, setActiveTab] = useState<'current' | 'optional' | 'payments' | 'history'>('current');
  const [selectedChild, setSelectedChild] = useState<string | null>(
    studentChildren.length > 0 ? studentChildren[0].id : null
  );

  const currentChild = studentChildren.find(child => child.id === selectedChild);

  const tabs = [
    { key: 'current', label: 'Current Fees', icon: '💳' },
    { key: 'optional', label: 'Optional Fees', icon: '⭐' },
    { key: 'payments', label: 'Payment History', icon: '📄' },
    { key: 'history', label: 'Fees History', icon: '📚' }
  ];

  if (studentChildren.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto p-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Children&apos;s School Fees</h1>
            <p className="text-gray-600">
              View and pay your children&apos;s school fees online using Paystack
            </p>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="text-gray-500 mb-2">No children found</div>
            <p className="text-sm text-gray-400">
              No children are associated with your account.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Children&apos;s School Fees</h1>
          <p className="text-gray-600">
            View and pay your children&apos;s school fees online using Paystack
          </p>
        </div>

        {/* Child Selection */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-700">Select Child:</span>
            <div className="flex gap-2">
              {studentChildren.map((child) => {
                const childOutstanding = child.fees.reduce((sum, fee) => sum + fee.remainingAmount, 0);
                return (
                  <button
                    key={child.id}
                    onClick={() => setSelectedChild(child.id)}
                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                      selectedChild === child.id
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span>{child.name} {child.surname}</span>
                      {childOutstanding > 0 && (
                        <span className="bg-red-100 text-red-800 text-xs px-2 py-0.5 rounded-full">
                          GH₵{childOutstanding.toFixed(0)}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {currentChild && (
          <>
            {/* Tab Navigation */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
              <div className="border-b border-gray-200">
                <div className="px-6 py-4 border-b border-gray-100">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {currentChild.name} {currentChild.surname} - {currentChild.className}
                  </h2>
                </div>
                <nav className="flex space-x-8 px-6" aria-label="Tabs">
                  {tabs.map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key as any)}
                      className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap flex items-center gap-2 ${
                        activeTab === tab.key
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <span>{tab.icon}</span>
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </div>

              <div className="p-6">
                {activeTab === 'current' && (
                  <ParentFeesClient 
                    parent={parent}
                    studentChildren={[currentChild]}
                  />
                )}

                {activeTab === 'optional' && (
                  <OptionalFeesManager 
                    studentId={currentChild.id}
                    currentClassId={currentChild.classId}
                    isParentView={true}
                    studentName={`${currentChild.name} ${currentChild.surname}`}
                    studentEmail={parent.email}
                    className={currentChild.className}
                  />
                )}

                {activeTab === 'payments' && (
                  <PaymentHistory 
                    studentId={currentChild.id}
                  />
                )}

                {activeTab === 'history' && (
                  <FeesHistory 
                    studentId={currentChild.id}
                  />
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ParentFeesPageClient;