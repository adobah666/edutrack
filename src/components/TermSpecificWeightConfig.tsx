'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

interface Subject {
  id: number;
  name: string;
  assignmentWeight: number;
  examWeight: number;
}

interface TermWeight {
  id?: number;
  term: string;
  assignmentWeight: number;
  examWeight: number;
}

interface TermSpecificWeightConfigProps {
  subjects: Subject[];
}

const TERMS = [
  { value: 'FIRST', label: 'First Term' },
  { value: 'SECOND', label: 'Second Term' },
  { value: 'THIRD', label: 'Third Term' },
  { value: 'FINAL', label: 'Final Term' },
];

const TermSpecificWeightConfig = ({ subjects }: TermSpecificWeightConfigProps) => {
  const [selectedSubject, setSelectedSubject] = useState<number | null>(null);
  const [termWeights, setTermWeights] = useState<{ [subjectId: number]: { [term: string]: TermWeight } }>({});
  const [editingTerm, setEditingTerm] = useState<{ subjectId: number; term: string } | null>(null);
  const [tempWeights, setTempWeights] = useState<{ assignment: number; exam: number }>({ assignment: 0.3, exam: 0.7 });
  const [isLoading, setIsLoading] = useState(false);

  // Load existing term weights for a subject
  const loadTermWeights = async (subjectId: number) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/subjects/${subjectId}/term-weights`);
      if (response.ok) {
        const weights = await response.json();
        setTermWeights(prev => ({
          ...prev,
          [subjectId]: weights.reduce((acc: any, weight: any) => ({
            ...acc,
            [weight.term]: weight
          }), {})
        }));
      }
    } catch (error) {
      console.error('Error loading term weights:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubjectSelect = (subjectId: number) => {
    setSelectedSubject(subjectId);
    if (!termWeights[subjectId]) {
      loadTermWeights(subjectId);
    }
  };

  const handleEditTerm = (subjectId: number, term: string) => {
    const subject = subjects.find(s => s.id === subjectId);
    const existingWeight = termWeights[subjectId]?.[term];
    
    setEditingTerm({ subjectId, term });
    setTempWeights({
      assignment: existingWeight?.assignmentWeight || subject?.assignmentWeight || 0.3,
      exam: existingWeight?.examWeight || subject?.examWeight || 0.7,
    });
  };

  const handleSaveTermWeight = async () => {
    if (!editingTerm) return;

    // Validate weights sum to 1.0
    const total = tempWeights.assignment + tempWeights.exam;
    if (Math.abs(total - 1.0) > 0.01) {
      toast.error('Assignment and Exam weights must sum to 100%');
      return;
    }

    try {
      const response = await fetch(`/api/subjects/${editingTerm.subjectId}/term-weights`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          term: editingTerm.term,
          assignmentWeight: tempWeights.assignment,
          examWeight: tempWeights.exam,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save term weight');
      }

      const savedWeight = await response.json();
      
      // Update local state
      setTermWeights(prev => ({
        ...prev,
        [editingTerm.subjectId]: {
          ...prev[editingTerm.subjectId],
          [editingTerm.term]: savedWeight
        }
      }));

      toast.success('Term-specific weight saved successfully!');
      setEditingTerm(null);
    } catch (error) {
      console.error('Error saving term weight:', error);
      toast.error('Failed to save term weight');
    }
  };

  const handleDeleteTermWeight = async (subjectId: number, term: string) => {
    try {
      const response = await fetch(`/api/subjects/${subjectId}/term-weights`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ term }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete term weight');
      }

      // Update local state
      setTermWeights(prev => {
        const updated = { ...prev };
        if (updated[subjectId]) {
          delete updated[subjectId][term];
        }
        return updated;
      });

      toast.success('Term-specific weight removed successfully!');
    } catch (error) {
      console.error('Error deleting term weight:', error);
      toast.error('Failed to remove term weight');
    }
  };

  const updateTempWeight = (type: 'assignment' | 'exam', value: number) => {
    const otherType = type === 'assignment' ? 'exam' : 'assignment';
    setTempWeights({
      [type]: value,
      [otherType]: 1.0 - value,
    } as any);
  };

  const getEffectiveWeight = (subjectId: number, term: string) => {
    const termWeight = termWeights[subjectId]?.[term];
    const subject = subjects.find(s => s.id === subjectId);
    
    return {
      assignment: termWeight?.assignmentWeight || subject?.assignmentWeight || 0.3,
      exam: termWeight?.examWeight || subject?.examWeight || 0.7,
      isCustom: !!termWeight
    };
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Term-Specific Grading Weights</h2>
        <p className="text-gray-600 text-sm">
          Set custom weights for specific terms. If not set, the general subject weights will be used.
        </p>
      </div>

      {/* Subject Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Subject</label>
        <select
          className="w-full p-2 border border-gray-300 rounded-md"
          value={selectedSubject || ''}
          onChange={(e) => handleSubjectSelect(Number(e.target.value))}
        >
          <option value="">Choose a subject...</option>
          {subjects.map((subject) => (
            <option key={subject.id} value={subject.id}>
              {subject.name}
            </option>
          ))}
        </select>
      </div>

      {/* Term Weights Configuration */}
      {selectedSubject && (
        <div className="space-y-4">
          <div className="border-b pb-4">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {subjects.find(s => s.id === selectedSubject)?.name} - Weight Configuration
            </h3>
            <div className="text-sm text-gray-600 mb-4">
              <strong>General Weights:</strong> {((subjects.find(s => s.id === selectedSubject)?.assignmentWeight || 0.3) * 100).toFixed(0)}% assignments, {((subjects.find(s => s.id === selectedSubject)?.examWeight || 0.7) * 100).toFixed(0)}% exams
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-4">Loading term weights...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {TERMS.map((term) => {
                const effectiveWeight = getEffectiveWeight(selectedSubject, term.value);
                const isEditing = editingTerm?.subjectId === selectedSubject && editingTerm?.term === term.value;

                return (
                  <div key={term.value} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900">{term.label}</h4>
                      <div className="flex items-center gap-2">
                        {effectiveWeight.isCustom && (
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Custom</span>
                        )}
                        {!isEditing && (
                          <button
                            onClick={() => handleEditTerm(selectedSubject, term.value)}
                            className="text-xs text-blue-600 border border-blue-300 px-2 py-1 rounded hover:bg-blue-50"
                          >
                            {effectiveWeight.isCustom ? 'Edit' : 'Customize'}
                          </button>
                        )}
                        {effectiveWeight.isCustom && !isEditing && (
                          <button
                            onClick={() => handleDeleteTermWeight(selectedSubject, term.value)}
                            className="text-xs text-red-600 border border-red-300 px-2 py-1 rounded hover:bg-red-50"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>

                    {isEditing ? (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            📝 Assignments: {(tempWeights.assignment * 100).toFixed(0)}%
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={tempWeights.assignment}
                            onChange={(e) => updateTempWeight('assignment', parseFloat(e.target.value))}
                            className="w-full"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            📊 Exams: {(tempWeights.exam * 100).toFixed(0)}%
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={tempWeights.exam}
                            onChange={(e) => updateTempWeight('exam', parseFloat(e.target.value))}
                            className="w-full"
                          />
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t">
                          <div className="text-xs text-gray-600">
                            Total: {((tempWeights.assignment + tempWeights.exam) * 100).toFixed(0)}%
                            {Math.abs((tempWeights.assignment + tempWeights.exam) - 1.0) > 0.01 && (
                              <span className="text-red-600 ml-2">⚠️ Must equal 100%</span>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setEditingTerm(null)}
                              className="text-xs text-gray-600 border border-gray-300 px-2 py-1 rounded hover:bg-gray-50"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={handleSaveTermWeight}
                              className="text-xs text-white bg-blue-600 px-2 py-1 rounded hover:bg-blue-700"
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-blue-50 rounded p-2 text-center">
                          <div className="text-xs text-blue-600">Assignments</div>
                          <div className="font-bold text-blue-700">
                            {(effectiveWeight.assignment * 100).toFixed(0)}%
                          </div>
                        </div>
                        <div className="bg-green-50 rounded p-2 text-center">
                          <div className="text-xs text-green-600">Exams</div>
                          <div className="font-bold text-green-700">
                            {(effectiveWeight.exam * 100).toFixed(0)}%
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {subjects.length === 0 && (
        <div className="text-center py-8">
          <div className="text-gray-500 mb-2">No subjects found</div>
          <p className="text-sm text-gray-400">
            Create subjects first to configure their term-specific weights.
          </p>
        </div>
      )}
    </div>
  );
};

export default TermSpecificWeightConfig;