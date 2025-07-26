'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

interface GradeScale {
  id?: number;
  grade: string;
  minPercentage: number;
  maxPercentage: number;
  description?: string;
  color?: string;
  order: number;
}

interface GradingScheme {
  id?: number;
  name: string;
  description?: string;
  isDefault: boolean;
  grades: GradeScale[];
}

interface GradingSchemeManagerProps {
  onSchemeSelect?: (schemeId: number) => void;
}

const PRESET_SCHEMES = {
  letterGrades: {
    name: "Letter Grades (A-F)",
    description: "Traditional letter grading system",
    grades: [
      { grade: "A+", minPercentage: 97, maxPercentage: 100, description: "Excellent", color: "#10B981", order: 1 },
      { grade: "A", minPercentage: 93, maxPercentage: 96, description: "Excellent", color: "#10B981", order: 2 },
      { grade: "A-", minPercentage: 90, maxPercentage: 92, description: "Very Good", color: "#34D399", order: 3 },
      { grade: "B+", minPercentage: 87, maxPercentage: 89, description: "Good", color: "#84CC16", order: 4 },
      { grade: "B", minPercentage: 83, maxPercentage: 86, description: "Good", color: "#84CC16", order: 5 },
      { grade: "B-", minPercentage: 80, maxPercentage: 82, description: "Above Average", color: "#A3A3A3", order: 6 },
      { grade: "C+", minPercentage: 77, maxPercentage: 79, description: "Average", color: "#F59E0B", order: 7 },
      { grade: "C", minPercentage: 73, maxPercentage: 76, description: "Average", color: "#F59E0B", order: 8 },
      { grade: "C-", minPercentage: 70, maxPercentage: 72, description: "Below Average", color: "#F97316", order: 9 },
      { grade: "D", minPercentage: 60, maxPercentage: 69, description: "Poor", color: "#EF4444", order: 10 },
      { grade: "F", minPercentage: 0, maxPercentage: 59, description: "Fail", color: "#DC2626", order: 11 },
    ]
  },
  simpleLetters: {
    name: "Simple Letter Grades (A-D)",
    description: "Simplified letter grading without plus/minus",
    grades: [
      { grade: "A", minPercentage: 90, maxPercentage: 100, description: "Excellent", color: "#10B981", order: 1 },
      { grade: "B", minPercentage: 80, maxPercentage: 89, description: "Good", color: "#84CC16", order: 2 },
      { grade: "C", minPercentage: 70, maxPercentage: 79, description: "Average", color: "#F59E0B", order: 3 },
      { grade: "D", minPercentage: 60, maxPercentage: 69, description: "Below Average", color: "#F97316", order: 4 },
      { grade: "F", minPercentage: 0, maxPercentage: 59, description: "Fail", color: "#EF4444", order: 5 },
    ]
  },
  numeric1to9: {
    name: "Numeric Scale (1-9)",
    description: "Numeric grading where 1 is highest and 9 is lowest",
    grades: [
      { grade: "1", minPercentage: 90, maxPercentage: 100, description: "Outstanding", color: "#10B981", order: 1 },
      { grade: "2", minPercentage: 80, maxPercentage: 89, description: "Very Good", color: "#34D399", order: 2 },
      { grade: "3", minPercentage: 70, maxPercentage: 79, description: "Good", color: "#84CC16", order: 3 },
      { grade: "4", minPercentage: 60, maxPercentage: 69, description: "Satisfactory", color: "#A3A3A3", order: 4 },
      { grade: "5", minPercentage: 50, maxPercentage: 59, description: "Adequate", color: "#F59E0B", order: 5 },
      { grade: "6", minPercentage: 40, maxPercentage: 49, description: "Below Average", color: "#F97316", order: 6 },
      { grade: "7", minPercentage: 30, maxPercentage: 39, description: "Poor", color: "#EF4444", order: 7 },
      { grade: "8", minPercentage: 20, maxPercentage: 29, description: "Very Poor", color: "#DC2626", order: 8 },
      { grade: "9", minPercentage: 0, maxPercentage: 19, description: "Fail", color: "#991B1B", order: 9 },
    ]
  },
  percentage: {
    name: "Percentage Only",
    description: "Show only percentage scores without letter grades",
    grades: [
      { grade: "Pass", minPercentage: 50, maxPercentage: 100, description: "Passing Grade", color: "#10B981", order: 1 },
      { grade: "Fail", minPercentage: 0, maxPercentage: 49, description: "Failing Grade", color: "#EF4444", order: 2 },
    ]
  }
};

const GradingSchemeManager = ({ onSchemeSelect }: GradingSchemeManagerProps) => {
  const [schemes, setSchemes] = useState<GradingScheme[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingScheme, setEditingScheme] = useState<GradingScheme | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  // Load existing schemes
  useEffect(() => {
    loadSchemes();
  }, []);

  const loadSchemes = async () => {
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

  const handleCreateFromPreset = (presetKey: string) => {
    const preset = PRESET_SCHEMES[presetKey as keyof typeof PRESET_SCHEMES];
    if (preset) {
      setEditingScheme({
        name: preset.name,
        description: preset.description,
        isDefault: false,
        grades: preset.grades.map((grade, index) => ({ ...grade, order: index + 1 }))
      });
      setIsCreating(true);
      setSelectedPreset('');
    }
  };

  const handleCreateCustom = () => {
    setEditingScheme({
      name: '',
      description: '',
      isDefault: false,
      grades: [
        { grade: 'A', minPercentage: 90, maxPercentage: 100, description: 'Excellent', color: '#10B981', order: 1 },
        { grade: 'F', minPercentage: 0, maxPercentage: 89, description: 'Fail', color: '#EF4444', order: 2 },
      ]
    });
    setIsCreating(true);
  };

  const handleSaveScheme = async () => {
    if (!editingScheme || !editingScheme.name.trim()) {
      toast.error('Please provide a scheme name');
      return;
    }

    // Validate grades
    if (editingScheme.grades.length === 0) {
      toast.error('Please add at least one grade');
      return;
    }

    // Sort grades by order and validate ranges
    const sortedGrades = [...editingScheme.grades].sort((a, b) => a.order - b.order);
    for (let i = 0; i < sortedGrades.length; i++) {
      const grade = sortedGrades[i];
      if (grade.minPercentage >= grade.maxPercentage) {
        toast.error(`Invalid range for grade ${grade.grade}: min must be less than max`);
        return;
      }
    }

    try {
      const response = await fetch('/api/grading-schemes', {
        method: editingScheme.id ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingScheme),
      });

      if (!response.ok) {
        throw new Error('Failed to save grading scheme');
      }

      toast.success(`Grading scheme ${editingScheme.id ? 'updated' : 'created'} successfully!`);
      setIsCreating(false);
      setEditingScheme(null);
      loadSchemes();
    } catch (error) {
      console.error('Error saving grading scheme:', error);
      toast.error('Failed to save grading scheme');
    }
  };

  const handleDeleteScheme = async (schemeId: number) => {
    if (!confirm('Are you sure you want to delete this grading scheme?')) return;

    try {
      const response = await fetch(`/api/grading-schemes/${schemeId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete grading scheme');
      }

      toast.success('Grading scheme deleted successfully!');
      loadSchemes();
    } catch (error) {
      console.error('Error deleting grading scheme:', error);
      toast.error('Failed to delete grading scheme');
    }
  };

  const addGrade = () => {
    if (!editingScheme) return;
    
    const newOrder = Math.max(...editingScheme.grades.map(g => g.order), 0) + 1;
    setEditingScheme({
      ...editingScheme,
      grades: [
        ...editingScheme.grades,
        {
          grade: '',
          minPercentage: 0,
          maxPercentage: 100,
          description: '',
          color: '#6B7280',
          order: newOrder
        }
      ]
    });
  };

  const updateGrade = (index: number, field: keyof GradeScale, value: any) => {
    if (!editingScheme) return;
    
    const updatedGrades = [...editingScheme.grades];
    updatedGrades[index] = { ...updatedGrades[index], [field]: value };
    setEditingScheme({ ...editingScheme, grades: updatedGrades });
  };

  const removeGrade = (index: number) => {
    if (!editingScheme) return;
    
    const updatedGrades = editingScheme.grades.filter((_, i) => i !== index);
    setEditingScheme({ ...editingScheme, grades: updatedGrades });
  };

  if (isLoading) {
    return <div className="text-center py-4">Loading grading schemes...</div>;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Grading Scheme Management</h2>
        <p className="text-gray-600 text-sm">
          Create and manage custom grading schemes for your subjects. You can use letter grades, numbers, or any custom scale.
        </p>
      </div>

      {!isCreating ? (
        <>
          {/* Create New Scheme Section */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-3">Create New Grading Scheme</h3>
            <div className="flex flex-wrap gap-3 mb-3">
              <select
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                value={selectedPreset}
                onChange={(e) => setSelectedPreset(e.target.value)}
              >
                <option value="">Choose a preset...</option>
                <option value="letterGrades">Letter Grades (A+ to F)</option>
                <option value="simpleLetters">Simple Letters (A to F)</option>
                <option value="numeric1to9">Numeric Scale (1-9)</option>
                <option value="percentage">Percentage Only</option>
              </select>
              <button
                onClick={() => handleCreateFromPreset(selectedPreset)}
                disabled={!selectedPreset}
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:bg-gray-400"
              >
                Use Preset
              </button>
              <button
                onClick={handleCreateCustom}
                className="px-4 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700"
              >
                Create Custom
              </button>
            </div>
          </div>

          {/* Existing Schemes */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">Existing Grading Schemes</h3>
            {schemes.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No grading schemes created yet. Create your first scheme above.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {schemes.map((scheme) => (
                  <div key={scheme.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{scheme.name}</h4>
                      <div className="flex items-center gap-2">
                        {scheme.isDefault && (
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Default</span>
                        )}
                        <button
                          onClick={() => {
                            setEditingScheme(scheme);
                            setIsCreating(true);
                          }}
                          className="text-xs text-blue-600 hover:text-blue-800"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteScheme(scheme.id!)}
                          className="text-xs text-red-600 hover:text-red-800"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    {scheme.description && (
                      <p className="text-sm text-gray-600 mb-3">{scheme.description}</p>
                    )}
                    <div className="flex flex-wrap gap-1">
                      {scheme.grades.sort((a, b) => a.order - b.order).map((grade) => (
                        <span
                          key={grade.grade}
                          className="text-xs px-2 py-1 rounded text-white"
                          style={{ backgroundColor: grade.color || '#6B7280' }}
                        >
                          {grade.grade} ({grade.minPercentage}-{grade.maxPercentage}%)
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        /* Create/Edit Form */
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">
              {editingScheme?.id ? 'Edit' : 'Create'} Grading Scheme
            </h3>
            <button
              onClick={() => {
                setIsCreating(false);
                setEditingScheme(null);
              }}
              className="text-gray-600 hover:text-gray-800"
            >
              ✕ Cancel
            </button>
          </div>

          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Scheme Name</label>
              <input
                type="text"
                className="w-full p-2 border border-gray-300 rounded-md"
                value={editingScheme?.name || ''}
                onChange={(e) => setEditingScheme(prev => prev ? { ...prev, name: e.target.value } : null)}
                placeholder="e.g., Letter Grades, Numeric Scale"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
              <input
                type="text"
                className="w-full p-2 border border-gray-300 rounded-md"
                value={editingScheme?.description || ''}
                onChange={(e) => setEditingScheme(prev => prev ? { ...prev, description: e.target.value } : null)}
                placeholder="Brief description of this grading scheme"
              />
            </div>
          </div>

          {/* Grades Configuration */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-gray-900">Grade Scale</h4>
              <button
                onClick={addGrade}
                className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
              >
                + Add Grade
              </button>
            </div>

            <div className="space-y-3">
              {editingScheme?.grades.sort((a, b) => a.order - b.order).map((grade, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-center p-3 bg-gray-50 rounded-lg">
                  <div className="col-span-2">
                    <input
                      type="text"
                      className="w-full p-1 border border-gray-300 rounded text-sm"
                      value={grade.grade}
                      onChange={(e) => updateGrade(index, 'grade', e.target.value)}
                      placeholder="Grade"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      className="w-full p-1 border border-gray-300 rounded text-sm"
                      value={grade.minPercentage}
                      onChange={(e) => updateGrade(index, 'minPercentage', parseFloat(e.target.value))}
                      placeholder="Min %"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      className="w-full p-1 border border-gray-300 rounded text-sm"
                      value={grade.maxPercentage}
                      onChange={(e) => updateGrade(index, 'maxPercentage', parseFloat(e.target.value))}
                      placeholder="Max %"
                    />
                  </div>
                  <div className="col-span-3">
                    <input
                      type="text"
                      className="w-full p-1 border border-gray-300 rounded text-sm"
                      value={grade.description || ''}
                      onChange={(e) => updateGrade(index, 'description', e.target.value)}
                      placeholder="Description"
                    />
                  </div>
                  <div className="col-span-1">
                    <input
                      type="color"
                      className="w-full h-8 border border-gray-300 rounded"
                      value={grade.color || '#6B7280'}
                      onChange={(e) => updateGrade(index, 'color', e.target.value)}
                    />
                  </div>
                  <div className="col-span-1">
                    <input
                      type="number"
                      className="w-full p-1 border border-gray-300 rounded text-sm"
                      value={grade.order}
                      onChange={(e) => updateGrade(index, 'order', parseInt(e.target.value))}
                      placeholder="Order"
                    />
                  </div>
                  <div className="col-span-1">
                    <button
                      onClick={() => removeGrade(index)}
                      className="w-full p-1 text-red-600 hover:text-red-800 text-sm"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end gap-3">
            <button
              onClick={() => {
                setIsCreating(false);
                setEditingScheme(null);
              }}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveScheme}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              {editingScheme?.id ? 'Update' : 'Create'} Scheme
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GradingSchemeManager;