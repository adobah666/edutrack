'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

interface Subject {
  id: number;
  name: string;
  gradingSchemeId?: number;
}

interface GradingScheme {
  id: number;
  name: string;
  description?: string;
  isDefault: boolean;
  grades: {
    grade: string;
    minPercentage: number;
    maxPercentage: number;
    color?: string;
    order: number;
  }[];
}

interface SubjectGradingSchemeAssignmentProps {
  subjects: Subject[];
}

const SubjectGradingSchemeAssignment = ({ subjects }: SubjectGradingSchemeAssignmentProps) => {
  const [schemes, setSchemes] = useState<GradingScheme[]>([]);
  const [assignments, setAssignments] = useState<{ [subjectId: number]: number | null }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadGradingSchemes();
    initializeAssignments();
  }, [subjects]);

  const loadGradingSchemes = async () => {
    try {
      const response = await fetch('/api/grading-schemes');
      if (response.ok) {
        const data = await response.json();
        setSchemes(data);
      }
    } catch (error) {
      console.error('Error loading grading schemes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const initializeAssignments = () => {
    const initialAssignments: { [subjectId: number]: number | null } = {};
    subjects.forEach(subject => {
      initialAssignments[subject.id] = subject.gradingSchemeId || null;
    });
    setAssignments(initialAssignments);
  };

  const handleAssignmentChange = (subjectId: number, schemeId: string) => {
    setAssignments(prev => ({
      ...prev,
      [subjectId]: schemeId === '' ? null : parseInt(schemeId)
    }));
  };

  const saveAssignment = async (subjectId: number) => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/subjects/${subjectId}/grading-scheme`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gradingSchemeId: assignments[subjectId],
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update grading scheme assignment');
      }

      toast.success('Grading scheme assignment updated successfully!');
    } catch (error) {
      console.error('Error saving assignment:', error);
      toast.error('Failed to update grading scheme assignment');
    } finally {
      setIsSaving(false);
    }
  };

  const getEffectiveScheme = (subjectId: number): GradingScheme | null => {
    const assignedSchemeId = assignments[subjectId];
    if (assignedSchemeId) {
      return schemes.find(s => s.id === assignedSchemeId) || null;
    }
    // Return default scheme if no specific assignment
    return schemes.find(s => s.isDefault) || null;
  };

  if (isLoading) {
    return <div className="text-center py-4">Loading grading schemes...</div>;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Subject Grading Scheme Assignment</h2>
        <p className="text-gray-600 text-sm">
          Assign specific grading schemes to subjects. If no scheme is assigned, the default scheme will be used.
        </p>
      </div>

      {subjects.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No subjects found. Create subjects first to assign grading schemes.
        </div>
      ) : schemes.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No grading schemes available. Create grading schemes first.
        </div>
      ) : (
        <div className="space-y-4">
          {subjects.map((subject) => {
            const effectiveScheme = getEffectiveScheme(subject.id);
            const hasChanges = assignments[subject.id] !== (subject.gradingSchemeId || null);

            return (
              <div key={subject.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-gray-900">{subject.name}</h3>
                  {hasChanges && (
                    <button
                      onClick={() => saveAssignment(subject.id)}
                      disabled={isSaving}
                      className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:bg-gray-400"
                    >
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Scheme Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Grading Scheme
                    </label>
                    <select
                      className="w-full p-2 border border-gray-300 rounded-md"
                      value={assignments[subject.id] || ''}
                      onChange={(e) => handleAssignmentChange(subject.id, e.target.value)}
                    >
                      <option value="">Use Default Scheme</option>
                      {schemes.map((scheme) => (
                        <option key={scheme.id} value={scheme.id}>
                          {scheme.name} {scheme.isDefault ? '(Default)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Current Scheme Preview */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Current Grading Scale
                    </label>
                    {effectiveScheme ? (
                      <div className="flex flex-wrap gap-1">
                        {effectiveScheme.grades.sort((a, b) => a.order - b.order).map((grade) => (
                          <span
                            key={grade.grade}
                            className="text-xs px-2 py-1 rounded text-white"
                            style={{ backgroundColor: grade.color || '#6B7280' }}
                            title={`${grade.minPercentage}-${grade.maxPercentage}%`}
                          >
                            {grade.grade}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500 italic">
                        No grading scheme available
                      </div>
                    )}
                  </div>
                </div>

                {/* Scheme Details */}
                {effectiveScheme && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600 mb-2">
                      <strong>Using:</strong> {effectiveScheme.name}
                      {assignments[subject.id] === null && effectiveScheme.isDefault && (
                        <span className="ml-2 text-blue-600">(Default)</span>
                      )}
                    </div>
                    {effectiveScheme.description && (
                      <div className="text-sm text-gray-600 mb-2">
                        {effectiveScheme.description}
                      </div>
                    )}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                      {effectiveScheme.grades.sort((a, b) => a.order - b.order).map((grade) => (
                        <div
                          key={grade.grade}
                          className="flex items-center justify-between p-1 rounded"
                          style={{ backgroundColor: grade.color + '20', color: grade.color }}
                        >
                          <span className="font-medium">{grade.grade}</span>
                          <span>{grade.minPercentage}-{grade.maxPercentage}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SubjectGradingSchemeAssignment;