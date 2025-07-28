'use client';

import { useState } from 'react';
import Link from 'next/link';
import FormModal from './FormModal';

interface Assignment {
  id: number;
  title: string;
  description: string;
  startDate: string;
  dueDate: string;
  maxPoints: number;
  term: string;
  subject: {
    id: number;
    name: string;
  };
  teacher: {
    id: string;
    name: string;
    surname: string;
    email?: string;
  };
  class: {
    id: number;
    name: string;
    students: {
      id: string;
      name: string;
      surname: string;
    }[];
  };
  results: {
    id: number;
    score: number;
    student: {
      id: string;
      name: string;
      surname: string;
    };
  }[];
}

interface AssignmentDetailClientProps {
  assignment: Assignment;
  userRole?: string;
  currentUserId: string;
  studentResult: any;
}

const AssignmentDetailClient = ({ 
  assignment, 
  userRole, 
  currentUserId, 
  studentResult 
}: AssignmentDetailClientProps) => {
  const [activeTab, setActiveTab] = useState<'details' | 'results'>('details');

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusInfo = () => {
    const now = new Date();
    const due = new Date(assignment.dueDate);
    const timeDiff = due.getTime() - now.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

    if (daysDiff < 0) {
      const overdueDays = Math.abs(daysDiff);
      return {
        text: `Overdue by ${overdueDays} day${overdueDays > 1 ? 's' : ''}`,
        color: 'text-red-600 bg-red-50 border-red-200',
        icon: '⚠️'
      };
    } else if (daysDiff === 0) {
      return {
        text: 'Due Today',
        color: 'text-orange-600 bg-orange-50 border-orange-200',
        icon: '🔥'
      };
    } else if (daysDiff <= 3) {
      return {
        text: `Due in ${daysDiff} day${daysDiff > 1 ? 's' : ''}`,
        color: 'text-yellow-600 bg-yellow-50 border-yellow-200',
        icon: '⏰'
      };
    } else {
      return {
        text: `Due in ${daysDiff} days`,
        color: 'text-green-600 bg-green-50 border-green-200',
        icon: '✅'
      };
    }
  };

  const statusInfo = getStatusInfo();

  // Calculate results statistics
  const totalStudents = assignment.class.students.length;
  const submittedResults = assignment.results.length;
  const averageScore = submittedResults > 0 
    ? Math.round(assignment.results.reduce((sum, result) => sum + result.score, 0) / submittedResults)
    : 0;
  const highestScore = submittedResults > 0 
    ? Math.max(...assignment.results.map(result => result.score))
    : 0;

  const tabs = [
    { key: 'details', label: 'Assignment Details', icon: '📋' },
    ...(userRole === 'admin' || userRole === 'teacher' ? [
      { key: 'results', label: 'Student Results', icon: '📊' }
    ] : [])
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Link
                href="/list/assignments"
                className="text-blue-600 hover:text-blue-800 flex items-center gap-2"
              >
                ← Back to Assignments
              </Link>
              <div className={`px-3 py-1 rounded-full text-sm font-medium border ${statusInfo.color} flex items-center gap-1`}>
                <span>{statusInfo.icon}</span>
                {statusInfo.text}
              </div>
            </div>
            {(userRole === 'admin' || userRole === 'teacher') && (
              <div className="flex gap-2">
                <FormModal table="assignment" type="update" data={assignment} />
                <FormModal table="assignment" type="delete" id={assignment.id} />
              </div>
            )}
          </div>
          
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{assignment.title}</h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                {assignment.subject.name}
              </span>
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                {assignment.class.name}
              </span>
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                {assignment.teacher.name} {assignment.teacher.surname}
              </span>
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
                {assignment.maxPoints} points
              </span>
            </div>
          </div>
        </div>

        {/* Student Result Card (for students and parents) */}
        {(userRole === 'student' || userRole === 'parent') && studentResult && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {userRole === 'student' ? 'Your Result' : 'Child Results'}
            </h3>
            {Array.isArray(studentResult) ? (
              // Parent view - multiple children
              <div className="space-y-3">
                {studentResult.map((result: any) => (
                  <div key={result.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">{result.student.name} {result.student.surname}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-blue-600">
                        {result.score}/{assignment.maxPoints}
                      </span>
                      <span className="text-sm text-gray-500">
                        ({Math.round((result.score / assignment.maxPoints) * 100)}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // Student view - single result
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <span className="text-gray-700">Your Score:</span>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-blue-600">
                    {studentResult.score}/{assignment.maxPoints}
                  </span>
                  <span className="text-sm text-gray-500">
                    ({Math.round((studentResult.score / assignment.maxPoints) * 100)}%)
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

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
            {activeTab === 'details' && (
              <div className="space-y-6">
                {/* Assignment Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Start Date</h4>
                      <p className="mt-1 text-lg text-gray-900">{formatDate(assignment.startDate)}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Due Date</h4>
                      <p className={`mt-1 text-lg font-medium ${statusInfo.color.includes('red') ? 'text-red-600' : statusInfo.color.includes('orange') ? 'text-orange-600' : statusInfo.color.includes('yellow') ? 'text-yellow-600' : 'text-gray-900'}`}>
                        {formatDate(assignment.dueDate)}
                      </p>
                      <div className={`mt-2 inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${statusInfo.color}`}>
                        <span>{statusInfo.icon}</span>
                        {statusInfo.text}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Term</h4>
                      <p className="mt-1 text-lg text-gray-900">{assignment.term}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Max Points</h4>
                      <p className="mt-1 text-lg text-gray-900">{assignment.maxPoints} points</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Students Enrolled</h4>
                      <p className="mt-1 text-lg text-gray-900">{totalStudents} students</p>
                    </div>
                    {(userRole === 'admin' || userRole === 'teacher') && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Submissions</h4>
                        <p className="mt-1 text-lg text-gray-900">{submittedResults}/{totalStudents} submitted</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Description</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-900 whitespace-pre-wrap leading-relaxed">
                      {assignment.description || 'No description provided.'}
                    </p>
                  </div>
                </div>

                {/* Quick Stats for Teachers/Admins */}
                {(userRole === 'admin' || userRole === 'teacher') && submittedResults > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Quick Statistics</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <div className="text-sm text-blue-600">Average Score</div>
                        <div className="text-2xl font-bold text-blue-900">{averageScore}/{assignment.maxPoints}</div>
                        <div className="text-sm text-blue-700">{Math.round((averageScore / assignment.maxPoints) * 100)}%</div>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <div className="text-sm text-green-600">Highest Score</div>
                        <div className="text-2xl font-bold text-green-900">{highestScore}/{assignment.maxPoints}</div>
                        <div className="text-sm text-green-700">{Math.round((highestScore / assignment.maxPoints) * 100)}%</div>
                      </div>
                      <div className="bg-purple-50 rounded-lg p-4">
                        <div className="text-sm text-purple-600">Completion Rate</div>
                        <div className="text-2xl font-bold text-purple-900">{Math.round((submittedResults / totalStudents) * 100)}%</div>
                        <div className="text-sm text-purple-700">{submittedResults} of {totalStudents}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'results' && (userRole === 'admin' || userRole === 'teacher') && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Student Results</h3>
                  <div className="text-sm text-gray-500">
                    {submittedResults} of {totalStudents} students submitted
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Student
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Score
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Percentage
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {assignment.class.students.map((student) => {
                        const result = assignment.results.find(r => r.student.id === student.id);
                        const percentage = result ? Math.round((result.score / assignment.maxPoints) * 100) : 0;
                        
                        return (
                          <tr key={student.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {student.name} {student.surname}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {result ? `${result.score}/${assignment.maxPoints}` : 'Not submitted'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {result ? `${percentage}%` : '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                result 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {result ? 'Submitted' : 'Pending'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {assignment.class.students.length === 0 && (
                  <div className="text-center py-12">
                    <div className="text-gray-500 mb-2">No students enrolled</div>
                    <p className="text-sm text-gray-400">
                      No students are enrolled in this class.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssignmentDetailClient;