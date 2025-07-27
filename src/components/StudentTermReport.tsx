'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';

interface SubjectResult {
  subjectId: number;
  subjectName: string;
  assignmentAverage: string;
  examAverage: string;
  finalPercentage: string;
  grade: string;
  assignmentCount: number;
  examCount: number;
  assignmentWeight: number;
  examWeight: number;
  isUsingTermSpecificWeights: boolean;
  hasAnyGrades: boolean;
  isPartialGrading: boolean;
}

interface StudentTermReportData {
  studentName: string;
  className: string;
  term: string;
  subjects: SubjectResult[];
  overallAverage: string;
  overallGrade: string;
  totalSubjects: number;
  gradedSubjects: number;
  isApprovalPending?: boolean;
  message?: string;
}

interface StudentTermReportProps {
  studentId: string;
  classId: number;
}

interface ClassHistoryItem {
  classId: number;
  className: string;
  gradeName: string;
  academicYear: string;
  isActive: boolean;
}

interface ClassHistory {
  classId: number;
  className: string;
  gradeName: string;
  academicYear: string;
  isActive: boolean;
}

const TERMS = [
  { value: 'FIRST', label: 'First Term' },
  { value: 'SECOND', label: 'Second Term' },
  { value: 'THIRD', label: 'Third Term' },
  { value: 'FINAL', label: 'Final Term' },
];

const StudentTermReport = ({ studentId, classId }: StudentTermReportProps) => {
  const [selectedTerm, setSelectedTerm] = useState<string>('FIRST');
  const [selectedClassId, setSelectedClassId] = useState<number>(classId);
  const [classHistory, setClassHistory] = useState<ClassHistoryItem[]>([]);
  const [reportData, setReportData] = useState<StudentTermReportData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const fetchClassHistory = useCallback(async () => {
    setIsLoadingHistory(true);
    try {
      const response = await fetch(`/api/students/${studentId}/class-history`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch class history');
      }

      const data = await response.json();
      setClassHistory(data);
    } catch (error) {
      console.error('Error fetching class history:', error);
      toast.error('Failed to load class history');
    } finally {
      setIsLoadingHistory(false);
    }
  }, [studentId]);

  const fetchTermReport = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/student-term-report?studentId=${studentId}&classId=${selectedClassId}&term=${selectedTerm}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch term report');
      }

      const data = await response.json();
      setReportData(data);
    } catch (error) {
      console.error('Error fetching term report:', error);
      toast.error('Failed to load term report');
    } finally {
      setIsLoading(false);
    }
  }, [studentId, selectedClassId, selectedTerm]);

  // Load class history on component mount
  useEffect(() => {
    fetchClassHistory();
  }, [fetchClassHistory]);

  // Fetch term report when term or class changes
  useEffect(() => {
    if (selectedTerm && selectedClassId) {
      fetchTermReport();
    }
  }, [selectedTerm, selectedClassId, fetchTermReport]);

  const getGradeColor = (grade: string) => {
    if (grade === 'Not Graded') return 'text-gray-500';
    if (grade.startsWith('A')) return 'text-green-600';
    if (grade.startsWith('B')) return 'text-blue-600';
    if (grade.startsWith('C')) return 'text-yellow-600';
    if (grade.startsWith('D')) return 'text-orange-600';
    if (grade === 'F') return 'text-red-600';
    // For numeric grades (1 is best, 9 is worst)
    if (['1', '2', '3'].includes(grade)) return 'text-green-600';
    if (['4', '5', '6'].includes(grade)) return 'text-yellow-600';
    if (['7', '8', '9'].includes(grade)) return 'text-red-600';
    return 'text-gray-600';
  };

  const getPercentageColor = (percentage: string) => {
    if (percentage === 'Not Graded') return 'text-gray-500';
    const numPercentage = parseFloat(percentage);
    if (isNaN(numPercentage)) return 'text-gray-500';
    if (numPercentage >= 90) return 'text-green-600';
    if (numPercentage >= 80) return 'text-blue-600';
    if (numPercentage >= 70) return 'text-yellow-600';
    if (numPercentage >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Term Report Card</h2>
        <p className="text-gray-600">View your complete academic performance for the selected term</p>
      </div>

      {/* Selection Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Class History Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Select Class/Academic Year</label>
          {isLoadingHistory ? (
            <div className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500">
              Loading class history...
            </div>
          ) : (
            <select
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(Number(e.target.value))}
            >
              {classHistory.map((classItem) => (
                <option key={`${classItem.classId}-${classItem.academicYear}`} value={classItem.classId}>
                  {classItem.className} ({classItem.gradeName}) - {classItem.academicYear}
                  {classItem.isActive && ' (Current)'}
                </option>
              ))}
            </select>
          )}
          <p className="text-xs text-gray-500 mt-1">
            View results from any class you&apos;ve been in
          </p>
        </div>

        {/* Term Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Select Term</label>
          <select
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={selectedTerm}
            onChange={(e) => setSelectedTerm(e.target.value)}
          >
            {TERMS.map((term) => (
              <option key={term.value} value={term.value}>
                {term.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading your term report...</p>
        </div>
      ) : reportData ? (
        <div className="space-y-6">
          {/* Student Info Header */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{reportData.studentName}</h3>
                <p className="text-gray-600">Class: {reportData.className}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Term</p>
                <p className="text-lg font-medium text-gray-900">{TERMS.find(t => t.value === selectedTerm)?.label}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Subjects Graded</p>
                <p className="text-lg font-medium text-gray-900">{reportData.gradedSubjects} of {reportData.totalSubjects}</p>
              </div>
            </div>
          </div>

          {/* Results Approval Pending Message */}
          {reportData.isApprovalPending ? (
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-8 border border-yellow-200 text-center">
              <div className="mb-4">
                <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
              </div>
              <h3 className="text-xl font-semibold text-yellow-800 mb-2">Results Not Yet Available</h3>
              <p className="text-yellow-700 mb-4">
                {reportData.message || `Results for ${TERMS.find(t => t.value === selectedTerm)?.label} are not yet approved for viewing.`}
              </p>
              <div className="text-sm text-yellow-600 bg-yellow-100 rounded-lg p-3 inline-block">
                <p className="font-medium">What does this mean?</p>
                <p className="mt-1">Your teacher is still reviewing and finalizing the results. Once approved, you&apos;ll be able to view your complete term report here.</p>
              </div>
            </div>
          ) : (
            <>
              {/* Overall Performance */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6 border border-green-200">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Overall Term Performance</h3>
              <div className="flex justify-center items-center gap-6">
                <div>
                  <p className="text-sm text-gray-600">Term Average</p>
                  <p className={`text-3xl font-bold ${getPercentageColor(reportData.overallAverage)}`}>
                    {reportData.overallAverage}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Overall Grade</p>
                  <p className={`text-3xl font-bold ${getGradeColor(reportData.overallGrade)}`}>
                    {reportData.overallGrade}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Subject Results Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subject
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assignments
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Exams
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Final Score
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Grade
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reportData.subjects.map((subject) => (
                  <tr key={subject.subjectId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{subject.subjectName}</div>
                      {subject.isUsingTermSpecificWeights && (
                        <div className="text-xs text-blue-600">Custom weights for this term</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="text-sm text-gray-900">
                        {subject.assignmentCount > 0 ? `${subject.assignmentAverage}%` : 'No grades'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {subject.assignmentCount} assignment{subject.assignmentCount !== 1 ? 's' : ''}
                      </div>
                      <div className="text-xs text-gray-400">
                        Weight: {(subject.assignmentWeight * 100).toFixed(0)}%
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="text-sm text-gray-900">
                        {subject.examCount > 0 ? `${subject.examAverage}%` : 'No grades'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {subject.examCount} exam{subject.examCount !== 1 ? 's' : ''}
                      </div>
                      <div className="text-xs text-gray-400">
                        Weight: {(subject.examWeight * 100).toFixed(0)}%
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className={`text-lg font-semibold ${getPercentageColor(subject.finalPercentage)}`}>
                        {subject.finalPercentage}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`text-lg font-bold ${getGradeColor(subject.grade)}`}>
                        {subject.grade}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {!subject.hasAnyGrades ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          Not Graded
                        </span>
                      ) : subject.isPartialGrading ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          Partial
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Complete
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Legend */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Understanding Your Report</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
              <div>
                <p><strong>Final Score:</strong> Calculated using weighted averages of assignments and exams</p>
                <p><strong>Partial:</strong> Only assignments or exams have been graded, not both</p>
              </div>
              <div>
                <p><strong>Not Graded:</strong> No assignments or exams have been graded yet</p>
                <p><strong>Term Average:</strong> Average of all graded subjects (excludes ungraded subjects)</p>
              </div>
            </div>
          </div>
            </>
          )}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500">No data available for the selected term</p>
        </div>
      )}
    </div>
  );
};

export default StudentTermReport;