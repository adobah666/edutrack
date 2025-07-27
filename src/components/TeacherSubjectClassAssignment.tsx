"use client";

import { useState, useEffect } from "react";
import { UseFormRegister, FieldErrors } from "react-hook-form";
import { TeacherSchema } from "@/lib/formValidationSchemas";
import { toast } from "react-toastify";

interface Subject {
  id: number;
  name: string;
}

interface Class {
  id: number;
  name: string;
}

interface TeacherSubjectClass {
  id?: number;
  subjectId: number;
  classId: number;
  subject?: Subject;
  class?: Class;
}

interface TeacherSubjectClassAssignmentProps {
  subjects: Subject[];
  classes: Class[];
  defaultAssignments?: TeacherSubjectClass[];
  register: UseFormRegister<TeacherSchema>;
  setValue: any; // UseFormSetValue from react-hook-form
  errors: FieldErrors<TeacherSchema>;
}

const TeacherSubjectClassAssignment = ({
  subjects,
  classes,
  defaultAssignments = [],
  register,
  setValue,
  errors,
}: TeacherSubjectClassAssignmentProps) => {
  // Transform existing assignments to the format we need
  console.log('Default assignments received:', defaultAssignments); // Debug log
  const transformedAssignments = defaultAssignments.map((assignment: any) => ({
    id: assignment.id,
    subjectId: assignment.subjectId || assignment.subject?.id || 0,
    classId: assignment.classId || assignment.class?.id || 0,
  }));
  console.log('Transformed assignments:', transformedAssignments); // Debug log
  
  const [assignments, setAssignments] = useState<TeacherSubjectClass[]>(transformedAssignments);

  // Update assignments when defaultAssignments change (for edit mode)
  useEffect(() => {
    if (defaultAssignments.length > 0) {
      const newTransformed = defaultAssignments.map((assignment: any) => ({
        id: assignment.id,
        subjectId: assignment.subjectId || assignment.subject?.id || 0,
        classId: assignment.classId || assignment.class?.id || 0,
      }));
      console.log('Updating assignments from defaultAssignments:', newTransformed);
      setAssignments(newTransformed);
    }
  }, [defaultAssignments]);

  const addAssignment = () => {
    setAssignments([...assignments, { subjectId: 0, classId: 0 }]);
  };

  const removeAssignment = (index: number) => {
    setAssignments(assignments.filter((_, i) => i !== index));
  };

  const updateAssignment = (index: number, field: 'subjectId' | 'classId', value: number) => {
    const updated = [...assignments];
    updated[index] = { ...updated[index], [field]: value };
    
    // Check for duplicates after update
    if (field === 'classId' && value > 0 && updated[index].subjectId > 0) {
      const isDuplicate = updated.some((assignment, i) => 
        i !== index && 
        assignment.subjectId === updated[index].subjectId && 
        assignment.classId === updated[index].classId
      );
      
      if (isDuplicate) {
        toast.error('This subject-class combination already exists!');
        return; // Don't update if duplicate
      }
    }
    
    if (field === 'subjectId' && value > 0 && updated[index].classId > 0) {
      const isDuplicate = updated.some((assignment, i) => 
        i !== index && 
        assignment.subjectId === updated[index].subjectId && 
        assignment.classId === updated[index].classId
      );
      
      if (isDuplicate) {
        toast.error('This subject-class combination already exists!');
        return; // Don't update if duplicate
      }
    }
    
    setAssignments(updated);
  };

  // Helper function to check if a subject-class combination is already used
  const isCombinationUsed = (subjectId: number, classId: number, currentIndex: number) => {
    return assignments.some((assignment, index) => 
      index !== currentIndex && 
      assignment.subjectId === subjectId && 
      assignment.classId === classId
    );
  };

  // Helper function to get available subjects for a specific assignment
  const getAvailableSubjects = (currentIndex: number, currentClassId: number) => {
    if (currentClassId === 0) return subjects; // If no class selected, show all subjects
    
    return subjects.filter(subject => 
      !isCombinationUsed(subject.id, currentClassId, currentIndex)
    );
  };

  // Helper function to get available classes for a specific assignment
  const getAvailableClasses = (currentIndex: number, currentSubjectId: number) => {
    if (currentSubjectId === 0) return classes; // If no subject selected, show all classes
    
    return classes.filter(cls => 
      !isCombinationUsed(currentSubjectId, cls.id, currentIndex)
    );
  };

  // Register the field once
  useEffect(() => {
    register("teacherSubjectClasses");
  }, [register]);

  // Update form value whenever assignments change
  useEffect(() => {
    const validAssignments = assignments.filter(assignment => assignment.subjectId > 0 && assignment.classId > 0);
    setValue("teacherSubjectClasses", validAssignments, { 
      shouldValidate: true,
      shouldDirty: true 
    });
  }, [assignments, setValue]);

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex items-center justify-between">
        <label className="text-xs text-gray-500">Subject & Class Assignments</label>
        <button
          type="button"
          onClick={addAssignment}
          className="bg-green-500 text-white px-3 py-1 rounded-md text-xs hover:bg-green-600"
        >
          + Add Assignment
        </button>
      </div>
      
      {assignments.length === 0 ? (
        <div className="text-xs text-gray-400 italic p-4 border border-dashed border-gray-300 rounded-md text-center">
          No assignments yet. Click &quot;Add Assignment&quot; to assign subjects to classes.
          <div className="text-xs text-red-500 mt-1">Debug: Received {defaultAssignments.length} default assignments</div>
        </div>
      ) : (
        <div className="space-y-3 max-h-40 overflow-y-auto border border-gray-200 rounded-md p-3">
          {assignments.map((assignment, index) => (
            <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded-md">
              <div className="flex-1">
                <select
                  value={assignment.subjectId}
                  onChange={(e) => updateAssignment(index, 'subjectId', parseInt(e.target.value))}
                  className="ring-[1.5px] ring-gray-300 p-1 rounded-md text-xs w-full"
                >
                  <option value={0}>Select Subject</option>
                  {getAvailableSubjects(index, assignment.classId).map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <span className="text-xs text-gray-500">to</span>
              
              <div className="flex-1">
                <select
                  value={assignment.classId}
                  onChange={(e) => updateAssignment(index, 'classId', parseInt(e.target.value))}
                  className="ring-[1.5px] ring-gray-300 p-1 rounded-md text-xs w-full"
                >
                  <option value={0}>Select Class</option>
                  {getAvailableClasses(index, assignment.subjectId).map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name}
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
      
      {errors.teacherSubjectClasses && (
        <p className="text-xs text-red-400">
          {errors.teacherSubjectClasses.message?.toString()}
        </p>
      )}
      
      <p className="text-xs text-gray-400">
        Assign specific subjects to specific classes. For example: &quot;Math to Class 1A&quot; or &quot;English to Class 2B&quot;.
        <br />
        <span className="text-orange-500">Note: Duplicate subject-class combinations are not allowed.</span>
      </p>
    </div>
  );
};

export default TeacherSubjectClassAssignment;