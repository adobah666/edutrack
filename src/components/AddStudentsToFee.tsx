'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

interface Student {
  id: string;
  name: string;
  surname: string;
  class: {
    name: string;
  } | null;
}

interface AddStudentsToFeeProps {
  classFeeId: number;
  onStudentsAdded: () => void;
}

const AddStudentsToFee = ({ classFeeId, onStudentsAdded }: AddStudentsToFeeProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [availableStudents, setAvailableStudents] = useState<Student[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch available students when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchAvailableStudents();
    }
  }, [isOpen]);

  const fetchAvailableStudents = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/fee-eligibility?classFeeId=${classFeeId}`);
      if (response.ok) {
        const students = await response.json();
        setAvailableStudents(students);
      } else {
        toast.error('Failed to fetch available students');
      }
    } catch (error) {
      toast.error('Error fetching students');
    } finally {
      setLoading(false);
    }
  };

  const handleStudentToggle = (studentId: string) => {
    setSelectedStudents(prev => 
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleSelectAll = () => {
    const filteredStudents = getFilteredStudents();
    const allIds = filteredStudents.map(s => s.id);
    setSelectedStudents(prev => {
      const newSelected = new Set([...prev, ...allIds]);
      return Array.from(newSelected);
    });
  };

  const handleDeselectAll = () => {
    const filteredStudents = getFilteredStudents();
    const filteredIds = filteredStudents.map(s => s.id);
    setSelectedStudents(prev => prev.filter(id => !filteredIds.includes(id)));
  };

  const getFilteredStudents = () => {
    if (!searchTerm.trim()) return availableStudents;
    
    const searchLower = searchTerm.toLowerCase();
    return availableStudents.filter(student => 
      `${student.name} ${student.surname}`.toLowerCase().includes(searchLower) ||
      student.class?.name.toLowerCase().includes(searchLower)
    );
  };

  const handleSubmit = async () => {
    if (selectedStudents.length === 0) {
      toast.error('Please select at least one student');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/fee-eligibility', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          classFeeId,
          studentIds: selectedStudents,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(result.message);
        setIsOpen(false);
        setSelectedStudents([]);
        setSearchTerm('');
        onStudentsAdded(); // Refresh the parent component
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('Error adding students to fee');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredStudents = getFilteredStudents();

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 flex items-center gap-2"
      >
        <span className="text-lg font-bold">+</span>
        Add Students
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Add Students to Fee</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-700 text-xl font-bold"
              >
                ×
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-8">
                <div className="text-gray-500">Loading available students...</div>
              </div>
            ) : (
              <>
                {/* Search Input */}
                <div className="mb-4">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search students by name or class..."
                    className="w-full p-2 border rounded-md"
                  />
                </div>

                {/* Selection Controls */}
                <div className="flex justify-between items-center mb-4">
                  <div className="flex gap-2">
                    <button
                      onClick={handleSelectAll}
                      className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600"
                    >
                      Select All {searchTerm ? 'Filtered' : ''}
                    </button>
                    <button
                      onClick={handleDeselectAll}
                      className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
                    >
                      Deselect All {searchTerm ? 'Filtered' : ''}
                    </button>
                  </div>
                  <div className="text-sm text-gray-600">
                    {selectedStudents.length} selected
                    {searchTerm && ` • ${filteredStudents.length} of ${availableStudents.length} shown`}
                  </div>
                </div>

                {/* Students List */}
                <div className="border rounded-md max-h-96 overflow-y-auto mb-4">
                  {filteredStudents.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      {searchTerm ? 'No students found matching your search.' : 'No students available to add.'}
                    </div>
                  ) : (
                    filteredStudents.map((student) => (
                      <div
                        key={student.id}
                        className="flex items-center p-3 border-b last:border-b-0 hover:bg-gray-50"
                      >
                        <input
                          type="checkbox"
                          checked={selectedStudents.includes(student.id)}
                          onChange={() => handleStudentToggle(student.id)}
                          className="mr-3"
                        />
                        <div className="flex-1">
                          <div className="font-medium">
                            {student.name} {student.surname}
                          </div>
                          <div className="text-sm text-gray-500">
                            {student.class ? `Class: ${student.class.name}` : 'No class assigned'}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setIsOpen(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={submitting || selectedStudents.length === 0}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
                  >
                    {submitting ? 'Adding...' : `Add ${selectedStudents.length} Students`}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default AddStudentsToFee;