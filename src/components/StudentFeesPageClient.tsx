'use client';

import { useState } from 'react';
import StudentFeesClient from './StudentFeesClient';
import OptionalFeesManager from './OptionalFeesManager';
import PaymentHistory from './PaymentHistory';
import FeesHistory from './FeesHistory';

interface Fee {
  id: number;
  feeType: string;
  totalAmount: number;
  totalPaid: number;
  remainingAmount: number;
  isPaid: boolean;
  dueDate: Date;
  payments: {
    id: number;
    amount: number;
    paidDate: Date;
  }[];
}

interface Student {
  id: string;
  name: string;
  surname: string;
  className: string;
  email: string;
}

interface StudentFeesPageClientProps {
  student: Student;
  fees: Fee[];
  currentClassId: number;
}

const StudentFeesPageClient = ({ student, fees, currentClassId }: StudentFeesPageClientProps) => {
  const [activeTab, setActiveTab] = useState<'current' | 'optional' | 'payments' | 'history'>('current');

  const tabs = [
    { key: 'current', label: 'Current Fees', icon: '💳' },
    { key: 'optional', label: 'Optional Fees', icon: '⭐' },
    { key: 'payments', label: 'Payment History', icon: '📄' },
    { key: 'history', label: 'Fees History', icon: '📚' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My School Fees</h1>
          <p className="text-gray-600">
            View and pay your school fees online using Paystack
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
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
              <StudentFeesClient 
                student={student}
                fees={fees}
              />
            )}

            {activeTab === 'optional' && (
              <OptionalFeesManager 
                studentId={student.id}
                currentClassId={currentClassId}
                isParentView={false}
                studentName={`${student.name} ${student.surname}`}
                studentEmail={student.email}
                className={student.className}
              />
            )}

            {activeTab === 'payments' && (
              <PaymentHistory 
                studentId={student.id}
              />
            )}

            {activeTab === 'history' && (
              <FeesHistory 
                studentId={student.id}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentFeesPageClient;