'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

interface Student {
  id: string;
  name: string;
  surname: string;
}

interface BreakdownItem {
  type: 'exam' | 'assignment';
  title: string;
  score: number;
  maxPoints: number;
  percentage: string;
  categoryWeight: number;
}

interface StudentResult {
  student: Student;
  finalPercentage: string;
  grade: string;
  assignmentAverage: string;
  examAverage: string;
  assignmentCount: number;
  examCount: number;
  breakdown: BreakdownItem[];
  hasAnyGrades?: boolean;
  isPartialGrading?: boolean;
}

interface TermResultsData {
  subject: string;
  class: string;
  term: string;
  totalExams: number;
  totalAssignments: number;
  assignmentWeight: number;
  examWeight: number;
  categoryWeights: {
    assignments: string;
    exams: string;
  };
  isUsingTermSpecificWeights?: boolean;
  results: StudentResult[];
}

interface TermResultsProps {
  classes: { id: number; name: string }[];
  subjects: { id: number; name: string }[];
}

const TermResults = ({ classes, subjects }: TermResultsProps) => {
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedTerm, setSelectedTerm] = useState<string>('FIRST');
  const [results, setResults] = useState<TermResultsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null);

  const terms = [
    { value: 'FIRST', label: 'First Term' },
    { value: 'SECOND', label: 'Second Term' },
    { value: 'THIRD', label: 'Third Term' },
    { value: 'FINAL', label: 'Final Term' },
  ];

  const fetchResults = async () => {
    if (!selectedClass || !selectedSubject || !selectedTerm) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `/api/term-results?classId=${selectedClass}&subjectId=${selectedSubject}&term=${selectedTerm}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch results');
      }

      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error('Error fetching results:', error);
      toast.error('Failed to fetch term results');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, [selectedClass, selectedSubject, selectedTerm]);

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A+':
      case 'A':
        return 'text-green-700 bg-green-100';
      case 'B+':
      case 'B':
        return 'text-blue-700 bg-blue-100';
      case 'C+':
      case 'C':
        return 'text-yellow-700 bg-yellow-100';
      case 'D':
        return 'text-orange-700 bg-orange-100';
      case 'F':
        return 'text-red-700 bg-red-100';
      default:
        return 'text-gray-700 bg-gray-100';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Term Results</h1>
          <p className="text-gray-600">
            View weighted term results combining assignments and exams
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Class
              </label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select a class</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject
              </label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select a subject</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Term
              </label>
              <select
                value={selectedTerm}
                onChange={(e) => setSelectedTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {terms.map((term) => (
                  <option key={term.value} value={term.value}>
                    {term.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Loading results...</p>
          </div>
        )}

        {/* Results */}
        {results && !loading && (
          <div className="space-y-6">
            {/* Summary */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                {results.subject} - {results.class} - {results.term} Term
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="font-medium text-blue-900 mb-2">
                    📝 Assignments ({results.totalAssignments})
                  </h3>
                  <div className="text-2xl font-bold text-blue-700 mb-2">
                    {results.categoryWeights.assignments}
                  </div>
                  <p className="text-sm text-blue-600">
                    All assignments combined contribute {results.categoryWeights.assignments} to the final grade
                  </p>
                </div>

                <div className="bg-green-50 rounded-lg p-4">
                  <h3 className="font-medium text-green-900 mb-2">
                    📊 Exams ({results.totalExams})
                  </h3>
                  <div className="text-2xl font-bold text-green-700 mb-2">
                    {results.categoryWeights.exams}
                  </div>
                  <p className="text-sm text-green-600">
                    All exams combined contribute {results.categoryWeights.exams} to the final grade
                  </p>
                </div>
              </div>

              {/* Weight Configuration Info */}
              {results.isUsingTermSpecificWeights && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-blue-600">⚙️</span>
                    <h4 className="font-medium text-blue-900">Term-Specific Weights Active</h4>
                  </div>
                  <p className="text-sm text-blue-700">
                    This term is using custom weights instead of the general subject weights.
                  </p>
                </div>
              )}

              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">How Grading Works:</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <div>• <strong>Assignment Average:</strong> All assignments are averaged together</div>
                  <div>• <strong>Exam Average:</strong> All exams are averaged together</div>
                  <div>• <strong>Final Grade:</strong> (Assignment Avg × {results.categoryWeights.assignments}) + (Exam Avg × {results.categoryWeights.exams})</div>
                  {results.isUsingTermSpecificWeights && (
                    <div className="text-blue-600 font-medium">• Using term-specific weights for this calculation</div>
                  )}
                </div>
              </div>
            </div>

            {/* Student Results */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Student Results</h3>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Final Score
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Grade
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {results.results.map((result) => (
                      <React.Fragment key={result.student.id}>
                        <tr className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {result.student.name} {result.student.surname}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {result.finalPercentage}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getGradeColor(result.grade)}`}>
                              {result.grade}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <button
                              onClick={() => setExpandedStudent(
                                expandedStudent === result.student.id ? null : result.student.id
                              )}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              {expandedStudent === result.student.id ? 'Hide' : 'View'} Breakdown
                            </button>
                          </td>
                        </tr>

                        {/* Expanded Breakdown */}
                        {expandedStudent === result.student.id && (
                          <tr>
                            <td colSpan={4} className="px-6 py-4 bg-gray-50">
                              <div className="space-y-4">
                                <h4 className="font-medium text-gray-900">Score Breakdown</h4>
                                
                                {/* Category Averages */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                                    <h5 className="font-medium text-blue-900 mb-1">📝 Assignment Average</h5>
                                    <div className="text-lg font-bold text-blue-700">{result.assignmentAverage}%</div>
                                    <div className="text-xs text-blue-600">
                                      Based on {result.assignmentCount} assignment{result.assignmentCount !== 1 ? 's' : ''}
                                    </div>
                                  </div>
                                  
                                  <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                                    <h5 className="font-medium text-green-900 mb-1">📊 Exam Average</h5>
                                    <div className="text-lg font-bold text-green-700">{result.examAverage}%</div>
                                    <div className="text-xs text-green-600">
                                      Based on {result.examCount} exam{result.examCount !== 1 ? 's' : ''}
                                    </div>
                                  </div>
                                </div>

                                {/* Individual Scores */}
                                <div className="space-y-2">
                                  <h5 className="font-medium text-gray-900">Individual Scores:</h5>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {result.breakdown.map((item, index) => (
                                      <div key={index} className="bg-white p-3 rounded-lg border">
                                        <div className="flex items-center justify-between mb-2">
                                          <span className="font-medium text-gray-900">{item.title}</span>
                                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                                            item.type === 'exam' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                                          }`}>
                                            {item.type}
                                          </span>
                                        </div>
                                        <div className="text-sm text-gray-600">
                                          <div>Score: {item.score}/{item.maxPoints} ({item.percentage}%)</div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* Final Calculation */}
                                <div className="bg-gray-100 p-3 rounded-lg">
                                  <h5 className="font-medium text-gray-900 mb-2">Final Grade Calculation:</h5>
                                  <div className="text-sm text-gray-700 space-y-1">
                                    {result.hasAnyGrades ? (
                                      <>
                                        {result.assignmentCount > 0 && (
                                          <div>Assignment Average: {result.assignmentAverage}% × {results.categoryWeights.assignments} = {(parseFloat(result.assignmentAverage) * results.assignmentWeight).toFixed(1)}%</div>
                                        )}
                                        {result.examCount > 0 && (
                                          <div>Exam Average: {result.examAverage}% × {results.categoryWeights.exams} = {(parseFloat(result.examAverage) * results.examWeight).toFixed(1)}%</div>
                                        )}
                                        {result.isPartialGrading && (
                                          <div className="text-orange-600 font-medium">
                                            ⚠️ Partial grading: Only {result.assignmentCount > 0 ? 'assignments' : 'exams'} have been graded
                                          </div>
                                        )}
                                        <div className="border-t pt-1 mt-2 font-medium">
                                          Final Grade: {result.finalPercentage} = {result.grade}
                                        </div>
                                      </>
                                    ) : (
                                      <div className="text-gray-500 italic">
                                        No grades available for calculation
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* No Results */}
        {!results && !loading && selectedClass && selectedSubject && selectedTerm && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="text-gray-500 mb-2">No results found</div>
            <p className="text-sm text-gray-400">
              No assignments or exams found for the selected criteria.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TermResults;