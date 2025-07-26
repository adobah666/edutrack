'use client';

import React, { useState } from 'react';
import { toast } from 'react-toastify';

interface Subject {
  id: number;
  name: string;
  assignmentWeight: number;
  examWeight: number;
}

interface SubjectWeightConfigProps {
  subjects: Subject[];
}

const SubjectWeightConfig = ({ subjects }: SubjectWeightConfigProps) => {
  const [editingSubject, setEditingSubject] = useState<number | null>(null);
  const [weights, setWeights] = useState<{ [key: number]: { assignment: number; exam: number } }>({});

  const handleEdit = (subject: Subject) => {
    setEditingSubject(subject.id);
    setWeights({
      ...weights,
      [subject.id]: {
        assignment: subject.assignmentWeight,
        exam: subject.examWeight,
      }
    });
  };

  const handleSave = async (subjectId: number) => {
    const weight = weights[subjectId];
    
    // Validate that weights sum to 1.0
    const total = weight.assignment + weight.exam;
    if (Math.abs(total - 1.0) > 0.01) {
      toast.error('Assignment and Exam weights must sum to 100%');
      return;
    }

    try {
      const response = await fetch('/api/subjects/weights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subjectId,
          assignmentWeight: weight.assignment,
          examWeight: weight.exam,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update weights');
      }

      toast.success('Subject weights updated successfully!');
      setEditingSubject(null);
      // Refresh the page to show updated data
      window.location.reload();
    } catch (error) {
      console.error('Error updating weights:', error);
      toast.error('Failed to update subject weights');
    }
  };

  const handleCancel = () => {
    setEditingSubject(null);
    setWeights({});
  };

  const updateWeight = (subjectId: number, type: 'assignment' | 'exam', value: number) => {
    const currentWeights = weights[subjectId] || { assignment: 0.3, exam: 0.7 };
    const otherType = type === 'assignment' ? 'exam' : 'assignment';
    
    setWeights({
      ...weights,
      [subjectId]: {
        ...currentWeights,
        [type]: value,
        [otherType]: 1.0 - value, // Auto-adjust the other weight
      }
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Subject Grading Weights</h2>
        <p className="text-gray-600 text-sm">
          Configure how assignments and exams contribute to the final grade for each subject.
        </p>
      </div>

      <div className="space-y-4">
        {subjects.map((subject) => (
          <div key={subject.id} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-medium text-gray-900">{subject.name}</h3>
              {editingSubject !== subject.id && (
                <button
                  onClick={() => handleEdit(subject)}
                  className="px-3 py-1 text-sm text-blue-600 border border-blue-300 rounded hover:bg-blue-50"
                >
                  Edit Weights
                </button>
              )}
            </div>

            {editingSubject === subject.id ? (
              // Edit Mode
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      📝 Assignments Weight
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={weights[subject.id]?.assignment || subject.assignmentWeight}
                        onChange={(e) => updateWeight(subject.id, 'assignment', parseFloat(e.target.value))}
                        className="flex-1"
                      />
                      <span className="text-sm font-medium text-gray-900 min-w-[50px]">
                        {((weights[subject.id]?.assignment || subject.assignmentWeight) * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      📊 Exams Weight
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={weights[subject.id]?.exam || subject.examWeight}
                        onChange={(e) => updateWeight(subject.id, 'exam', parseFloat(e.target.value))}
                        className="flex-1"
                      />
                      <span className="text-sm font-medium text-gray-900 min-w-[50px]">
                        {((weights[subject.id]?.exam || subject.examWeight) * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t">
                  <div className="text-sm text-gray-600">
                    Total: {(((weights[subject.id]?.assignment || subject.assignmentWeight) + 
                             (weights[subject.id]?.exam || subject.examWeight)) * 100).toFixed(0)}%
                    {Math.abs(((weights[subject.id]?.assignment || subject.assignmentWeight) + 
                              (weights[subject.id]?.exam || subject.examWeight)) - 1.0) > 0.01 && (
                      <span className="text-red-600 ml-2">⚠️ Must equal 100%</span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleCancel}
                      className="px-3 py-1 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleSave(subject.id)}
                      className="px-3 py-1 text-sm text-white bg-blue-600 rounded hover:bg-blue-700"
                    >
                      Save
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              // View Mode
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-blue-50 rounded-lg p-3">
                  <div className="text-sm text-blue-600 mb-1">📝 Assignments</div>
                  <div className="text-2xl font-bold text-blue-700">
                    {(subject.assignmentWeight * 100).toFixed(0)}%
                  </div>
                  <div className="text-xs text-blue-600">
                    All assignments averaged together
                  </div>
                </div>

                <div className="bg-green-50 rounded-lg p-3">
                  <div className="text-sm text-green-600 mb-1">📊 Exams</div>
                  <div className="text-2xl font-bold text-green-700">
                    {(subject.examWeight * 100).toFixed(0)}%
                  </div>
                  <div className="text-xs text-green-600">
                    All exams averaged together
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {subjects.length === 0 && (
        <div className="text-center py-8">
          <div className="text-gray-500 mb-2">No subjects found</div>
          <p className="text-sm text-gray-400">
            Create subjects first to configure their grading weights.
          </p>
        </div>
      )}
    </div>
  );
};

export default SubjectWeightConfig;