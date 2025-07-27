"use client";

import { useState, useEffect, useMemo } from "react";
import { UseFormRegister, FieldErrors } from "react-hook-form";
import { ParentSchema } from "@/lib/formValidationSchemas";
import { toast } from "react-toastify";

interface Student {
  id: string;
  name: string;
  surname: string;
  className?: string;
}

interface ParentStudentRelationship {
  id?: number;
  studentId: string;
  relationshipType: string;
  student?: Student;
}

interface ParentStudentAssignmentProps {
  students: Student[];
  defaultAssignments?: ParentStudentRelationship[];
  register: any; // UseFormRegister<ParentSchema>
  setValue: any; // UseFormSetValue from react-hook-form
  errors: FieldErrors<ParentSchema>;
}

const relationshipTypes = [
  { value: "FATHER", label: "Father" },
  { value: "MOTHER", label: "Mother" },
  { value: "GUARDIAN", label: "Guardian" },
  { value: "UNCLE", label: "Uncle" },
  { value: "AUNT", label: "Aunt" },
  { value: "GRANDFATHER", label: "Grandfather" },
  { value: "GRANDMOTHER", label: "Grandmother" },
  { value: "STEPFATHER", label: "Step Father" },
  { value: "STEPMOTHER", label: "Step Mother" },
  { value: "OTHER", label: "Other" },
];

const ParentStudentAssignment = ({
  students,
  defaultAssignments = [],
  register,
  setValue,
  errors,
}: ParentStudentAssignmentProps) => {
  // Transform existing assignments to the format we need
  console.log('Default parent-student assignments received:', defaultAssignments); // Debug log
  const transformedAssignments = defaultAssignments.map((assignment: any) => ({
    id: assignment.id,
    studentId: assignment.studentId || assignment.student?.id || "",
    relationshipType: assignment.relationshipType || "",
  }));
  console.log('Transformed parent-student assignments:', transformedAssignments); // Debug log
  
  const [assignments, setAssignments] = useState<ParentStudentRelationship[]>(transformedAssignments);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClass, setSelectedClass] = useState("");

  // Update assignments when defaultAssignments change (for edit mode)
  useEffect(() => {
    if (defaultAssignments.length > 0) {
      const newTransformed = defaultAssignments.map((assignment: any) => ({
        id: assignment.id,
        studentId: assignment.studentId || assignment.student?.id || "",
        relationshipType: assignment.relationshipType || "",
      }));
      console.log('Updating parent-student assignments from defaultAssignments:', newTransformed);
      setAssignments(newTransformed);
    }
  }, [defaultAssignments]);

  const addAssignment = () => {
    setAssignments([...assignments, { studentId: "", relationshipType: "" }]);
  };

  const removeAssignment = (index: number) => {
    setAssignments(assignments.filter((_, i) => i !== index));
  };

  const updateAssignment = (index: number, field: 'studentId' | 'relationshipType', value: string) => {
    const updated = [...assignments];
    updated[index] = { ...updated[index], [field]: value };
    
    // Check for duplicates after update (same student can't have same parent twice)
    if (field === 'studentId' && value !== "") {
      const isDuplicate = updated.some((assignment, i) => 
        i !== index && assignment.studentId === value
      );
      
      if (isDuplicate) {
        toast.error('This student is already assigned to this parent!');
        return; // Don't update if duplicate
      }
    }
    
    setAssignments(updated);
  };

  // Helper function to check if a student is already assigned
  const isStudentAssigned = (studentId: string, currentIndex: number) => {
    return assignments.some((assignment, index) => 
      index !== currentIndex && assignment.studentId === studentId
    );
  };

  // Get unique class names for filtering
  const uniqueClasses = useMemo(() => {
    const classes = students
      .map(student => student.className)
      .filter((className, index, arr) => className && arr.indexOf(className) === index)
      .sort();
    return classes;
  }, [students]);

  // Helper function to get available students for a specific assignment with filtering
  const getAvailableStudents = (currentIndex: number) => {
    return students.filter(student => {
      // Don't show already assigned students
      if (isStudentAssigned(student.id, currentIndex)) return false;
      
      // Filter by search term (name or surname)
      if (searchTerm) {
        const fullName = `${student.name} ${student.surname}`.toLowerCase();
        if (!fullName.includes(searchTerm.toLowerCase())) return false;
      }
      
      // Filter by selected class
      if (selectedClass && student.className !== selectedClass) return false;
      
      return true;
    });
  };

  // Register the field once
  useEffect(() => {
    register("parentStudents");
  }, [register]);

  // Update form value whenever assignments change
  useEffect(() => {
    const validAssignments = assignments.filter(assignment => 
      assignment.studentId !== "" && assignment.relationshipType !== ""
    );
    setValue("parentStudents", validAssignments, { 
      shouldValidate: true,
      shouldDirty: true 
    });
  }, [assignments, setValue]);

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex items-center justify-between">
        <label className="text-xs text-gray-500">Student & Relationship Assignments</label>
        <button
          type="button"
          onClick={addAssignment}
          className="bg-green-500 text-white px-3 py-1 rounded-md text-xs hover:bg-green-600"
        >
          + Add Student
        </button>
      </div>

      {/* Search and Filter Controls */}
      <div className="flex gap-2 mb-2">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search students by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-xs w-full"
          />
        </div>
        <div className="flex-1">
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-xs w-full"
          >
            <option value="">All Classes</option>
            {uniqueClasses.map((className) => (
              <option key={className} value={className}>
                {className}
              </option>
            ))}
          </select>
        </div>
        {(searchTerm || selectedClass) && (
          <button
            type="button"
            onClick={() => {
              setSearchTerm("");
              setSelectedClass("");
            }}
            className="bg-gray-500 text-white px-3 py-2 rounded-md text-xs hover:bg-gray-600"
            title="Clear filters"
          >
            Clear
          </button>
        )}
      </div>

      {/* Filter Status Indicator */}
      {(searchTerm || selectedClass) && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-2 mb-2">
          <div className="flex items-center gap-2">
            <span className="text-blue-600 text-xs font-medium">Filters applied:</span>
            <div className="flex gap-2 flex-wrap">
              {searchTerm && (
                <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">
                  Name: "{searchTerm}"
                </span>
              )}
              {selectedClass && (
                <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">
                  Class: {selectedClass}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
      
      {assignments.length === 0 ? (
        <div className="text-xs text-gray-400 italic p-4 border border-dashed border-gray-300 rounded-md text-center">
          No students assigned yet. Click &quot;Add Student&quot; to assign students to this parent.
          <div className="text-xs text-red-500 mt-1">Debug: Received {defaultAssignments.length} default assignments</div>
        </div>
      ) : (
        <div className="space-y-3 max-h-40 overflow-y-auto border border-gray-200 rounded-md p-3">
          {assignments.map((assignment, index) => (
            <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded-md">
              <div className="flex-1">
                <select
                  value={assignment.studentId}
                  onChange={(e) => updateAssignment(index, 'studentId', e.target.value)}
                  className="ring-[1.5px] ring-gray-300 p-1 rounded-md text-xs w-full"
                >
                  <option value="">Select Student</option>
                  {getAvailableStudents(index).length === 0 ? (
                    <option disabled>No students match current filters</option>
                  ) : (
                    getAvailableStudents(index).map((student) => (
                      <option key={student.id} value={student.id}>
                        {student.name} {student.surname} {student.className ? `(${student.className})` : ''}
                      </option>
                    ))
                  )}
                </select>
              </div>
              
              <span className="text-xs text-gray-500">as</span>
              
              <div className="flex-1">
                <select
                  value={assignment.relationshipType}
                  onChange={(e) => updateAssignment(index, 'relationshipType', e.target.value)}
                  className="ring-[1.5px] ring-gray-300 p-1 rounded-md text-xs w-full"
                >
                  <option value="">Select Relationship</option>
                  {relationshipTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <button
                type="button"
                onClick={() => removeAssignment(index)}
                className="bg-red-500 text-white px-2 py-1 rounded-md text-xs hover:bg-red-600"
                title="Remove assignment"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
      
      {errors.parentStudents && (
        <p className="text-xs text-red-400">
          {errors.parentStudents.message?.toString()}
        </p>
      )}
      
      <p className="text-xs text-gray-400">
        Assign students to this parent/guardian with their relationship type. Use the search and class filter above to find students easily.
        <br />
        <span className="text-orange-500">Note: Each student can only be assigned once per parent.</span>
      </p>
    </div>
  );
};

export default ParentStudentAssignment;