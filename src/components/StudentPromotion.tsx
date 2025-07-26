'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

interface Student {
  id: string;
  name: string;
  surname: string;
  username: string;
  currentClass: {
    id: number;
    name: string;
    grade: {
      id: number;
      name: string;
      level: number;
    };
  };
}

interface Class {
  id: number;
  name: string;
  grade: {
    id: number;
    name: string;
    level: number;
  };
}

interface StudentPromotionProps {
  currentClassId?: number;
}

const StudentPromotion = ({ currentClassId }: StudentPromotionProps) => {
  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedFromClass, setSelectedFromClass] = useState<number>(currentClassId || 0);
  const [selectedToClass, setSelectedToClass] = useState<number>(0);
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [academicYear, setAcademicYear] = useState<string>('');
  const [promotionNotes, setPromotionNotes] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);

  // Generate current academic year
  useEffect(() => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();
    
    // Academic year typically starts in September (month 8)
    const academicStartYear = currentMonth >= 8 ? currentYear : currentYear - 1;
    const academicEndYear = academicStartYear + 1;
    
    setAcademicYear(`${academicStartYear}-${academicEndYear}`);
  }, []);

  // Load classes
  useEffect(() => {
    loadClasses();
  }, []);

  // Load students when from class is selected
  useEffect(() => {
    if (selectedFromClass) {
      loadStudents(selectedFromClass);
    } else {
      setStudents([]);
    }
  }, [selectedFromClass]);

  const loadClasses = async () => {
    try {
      const response = await fetch('/api/classes');
      if (response.ok) {
        const data = await response.json();
        setClasses(data);
      }
    } catch (error) {
      console.error('Error loading classes:', error);
      toast.error('Failed to load classes');
    }
  };

  const loadStudents = async (classId: number) => {
    setIsLoadingStudents(true);
    try {
      const response = await fetch(`/api/students/by-class/${classId}`);
      if (response.ok) {
        const data = await response.json();
        setStudents(data);
      }
    } catch (error) {
      console.error('Error loading students:', error);
      toast.error('Failed to load students');
    } finally {
      setIsLoadingStudents(false);
    }
  };

  const handleStudentToggle = (studentId: string) => {
    const newSelected = new Set(selectedStudents);
    if (newSelected.has(studentId)) {
      newSelected.delete(studentId);
    } else {
      newSelected.add(studentId);
    }
    setSelectedStudents(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedStudents.size === students.length) {
      setSelectedStudents(new Set());
    } else {
      setSelectedStudents(new Set(students.map(s => s.id)));
    }
  };

  const handlePromoteStudents = async () => {
    if (selectedStudents.size === 0) {
      toast.error('Please select at least one student to promote');
      return;
    }

    if (!selectedToClass) {
      toast.error('Please select a destination class');
      return;
    }

    if (selectedFromClass === selectedToClass) {
      toast.error('Cannot promote students to the same class');
      return;
    }

    if (!academicYear.trim()) {
      toast.error('Please specify the academic year');
      return;
    }

    const confirmMessage = `Are you sure you want to promote ${selectedStudents.size} student(s) from ${classes.find(c => c.id === selectedFromClass)?.name} to ${classes.find(c => c.id === selectedToClass)?.name} for academic year ${academicYear}?`;
    
    if (!confirm(confirmMessage)) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/students/promote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentIds: Array.from(selectedStudents),
          fromClassId: selectedFromClass,
          toClassId: selectedToClass,
          academicYear: academicYear.trim(),
          notes: promotionNotes.trim() || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to promote students');
      }

      const result = await response.json();
      toast.success(`Successfully promoted ${result.promotedCount} student(s)!`);
      
      // Reset form
      setSelectedStudents(new Set());
      setPromotionNotes('');
      
      // Reload students to reflect changes
      loadStudents(selectedFromClass);
      
      // Refresh the entire page to update the student list
      setTimeout(() => {
        window.location.reload();
      }, 1500); // Give time for the success message to be seen
      
    } catch (error) {
      console.error('Error promoting students:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to promote students');
    } finally {
      setIsLoading(false);
    }
  };

  const getNextGradeClass = () => {
    if (!selectedFromClass) return null;
    
    const currentClass = classes.find(c => c.id === selectedFromClass);
    if (!currentClass) return null;
    
    const nextGradeLevel = currentClass.grade.level + 1;
    return classes.filter(c => c.grade.level === nextGradeLevel);
  };

  const nextGradeClasses = getNextGradeClass();

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Student Promotion</h2>
        <p className="text-gray-600 text-sm">
          Promote students to the next class or grade level. This will update their current class and maintain their academic history.
        </p>
      </div>

      <div className="space-y-6">
        {/* Academic Year */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Academic Year</label>
          <input
            type="text"
            className="w-full md:w-64 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={academicYear}
            onChange={(e) => setAcademicYear(e.target.value)}
            placeholder="e.g., 2023-2024"
          />
        </div>

        {/* Class Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">From Class</label>
            <select
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={selectedFromClass}
              onChange={(e) => setSelectedFromClass(Number(e.target.value))}
            >
              <option value={0}>Select current class...</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} ({cls.grade.name})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">To Class</label>
            <select
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={selectedToClass}
              onChange={(e) => setSelectedToClass(Number(e.target.value))}
            >
              <option value={0}>Select destination class...</option>
              {nextGradeClasses && nextGradeClasses.length > 0 && (
                <optgroup label="Next Grade Level (Recommended)">
                  {nextGradeClasses.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name} ({cls.grade.name})
                    </option>
                  ))}
                </optgroup>
              )}
              <optgroup label="All Classes">
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} ({cls.grade.name})
                  </option>
                ))}
              </optgroup>
            </select>
          </div>
        </div>

        {/* Promotion Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Promotion Notes (Optional)</label>
          <textarea
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows={3}
            value={promotionNotes}
            onChange={(e) => setPromotionNotes(e.target.value)}
            placeholder="Add any notes about this promotion (e.g., 'End of academic year promotion', 'Exceptional performance', etc.)"
          />
        </div>

        {/* Student Selection */}
        {selectedFromClass > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Select Students to Promote
                {students.length > 0 && (
                  <span className="text-sm text-gray-500 ml-2">
                    ({selectedStudents.size} of {students.length} selected)
                  </span>
                )}
              </h3>
              {students.length > 0 && (
                <button
                  onClick={handleSelectAll}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  {selectedStudents.size === students.length ? 'Deselect All' : 'Select All'}
                </button>
              )}
            </div>

            {isLoadingStudents ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-gray-600">Loading students...</p>
              </div>
            ) : students.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No students found in the selected class.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto border border-gray-200 rounded-lg p-4">
                {students.map((student) => (
                  <label
                    key={student.id}
                    className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      checked={selectedStudents.has(student.id)}
                      onChange={() => handleStudentToggle(student.id)}
                    />
                    <div>
                      <div className="font-medium text-gray-900">
                        {student.name} {student.surname}
                      </div>
                      <div className="text-sm text-gray-500">
                        {student.username}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Promotion Button */}
        {selectedFromClass > 0 && selectedToClass > 0 && selectedStudents.size > 0 && (
          <div className="flex justify-end">
            <button
              onClick={handlePromoteStudents}
              disabled={isLoading}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Promoting...
                </>
              ) : (
                <>
                  🎓 Promote {selectedStudents.size} Student{selectedStudents.size !== 1 ? 's' : ''}
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentPromotion;