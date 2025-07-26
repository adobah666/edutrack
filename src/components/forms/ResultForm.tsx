"use client";

import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useFormState } from "react-dom";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { z } from "zod";
import {
  createResult,
  updateResult,
  fetchStudents,
  fetchExams,
  fetchAssignments
} from "@/lib/actions";

const resultSchema = z.object({
  id: z.coerce.number().optional(),
  score: z.coerce.number().min(0, { message: "Score must be a positive number!" }),
  studentId: z.string().min(1, { message: "Student is required!" }),
  examId: z.union([z.coerce.number(), z.literal("")]).optional().transform(val => val === "" ? undefined : val),
  assignmentId: z.union([z.coerce.number(), z.literal("")]).optional().transform(val => val === "" ? undefined : val),
  feedback: z.string().optional(),
}).refine((data) => data.examId || data.assignmentId, {
  message: "Either an exam or assignment must be selected!",
  path: ["examId"],
});

export type ResultSchema = z.infer<typeof resultSchema>;

export default function ResultForm({
  type,
  data,
  setOpen
}: {
  type: "create" | "update";
  data?: Partial<ResultSchema>;
  setOpen: (open: boolean) => void;
}) {
  const [students, setStudents] = useState<Array<{ id: string; name: string; surname: string; classId?: number | null }>>([]);
  const [exams, setExams] = useState<Array<{ id: number; title: string; maxPoints?: number; classId?: number | null }>>([]);
  const [assignments, setAssignments] = useState<Array<{ id: number; title: string; maxPoints?: number; classId?: number | null }>>([]);
  const [assessmentType, setAssessmentType] = useState<'exam' | 'assignment'>(data?.examId ? 'exam' : data?.assignmentId ? 'assignment' : 'exam');
  const [selectedExamId, setSelectedExamId] = useState<number | undefined>(data?.examId);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<number | undefined>(data?.assignmentId);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [noStudentsMessage, setNoStudentsMessage] = useState<string>("");

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<ResultSchema>({
    resolver: zodResolver(resultSchema),
    defaultValues: data
  });

  // Fetch exams and assignments on component mount
  useEffect(() => {
    const loadAssessments = async () => {
      try {
        const [fetchedExams, fetchedAssignments] = await Promise.all([
          fetchExams(),
          fetchAssignments()
        ]);
        setExams(fetchedExams);
        setAssignments(fetchedAssignments);
        setIsLoading(false);
      } catch (error) {
        console.error("Failed to fetch assessments", error);
        setIsLoading(false);
        toast.error("Failed to load assessments");
      }
    };
    loadAssessments();
  }, []);

  // Fetch students when an exam or assignment is selected
  useEffect(() => {
    const loadStudents = async () => {
      setIsLoadingStudents(true);
      setNoStudentsMessage("");
      
      try {
        let selectedAssessment = null;
        let assessmentId = null;
        let apiEndpoint = '';
        let assessmentName = '';

        if (assessmentType === 'exam' && selectedExamId) {
          selectedAssessment = exams.find(exam => exam.id === selectedExamId);
          assessmentId = selectedExamId;
          apiEndpoint = `/api/results?examId=${selectedExamId}`;
          assessmentName = 'exam';
        } else if (assessmentType === 'assignment' && selectedAssignmentId) {
          selectedAssessment = assignments.find(assignment => assignment.id === selectedAssignmentId);
          assessmentId = selectedAssignmentId;
          apiEndpoint = `/api/results?assignmentId=${selectedAssignmentId}`;
          assessmentName = 'assignment';
        }

        if (selectedAssessment?.classId) {
          const fetchedStudents = await fetchStudents();
          
          // Fetch existing results for this assessment
          const response = await fetch(apiEndpoint);
          if (!response.ok) {
            throw new Error("Failed to fetch assessment results");
          }
          const existingResults = await response.json();
          const studentsWithResults = new Set(existingResults.map((result: any) => result.studentId));
          
          // Filter students for the selected assessment's class and exclude those who already have results
          const classStudents = fetchedStudents.filter(student => 
            student.classId === selectedAssessment.classId && !studentsWithResults.has(student.id)
          );
          
          setStudents(classStudents);
          
          // Set appropriate message if no students are available
          if (classStudents.length === 0) {
            const totalClassStudents = fetchedStudents.filter(student => 
              student.classId === selectedAssessment.classId
            );
            
            if (totalClassStudents.length === 0) {
              setNoStudentsMessage(`No students found in the class for this ${assessmentName}.`);
            } else {
              setNoStudentsMessage(`All students in this class have already been graded for this ${assessmentName}.`);
            }
          }
        } else {
          setStudents([]);
          setNoStudentsMessage(`Please select a valid ${assessmentName} to see available students.`);
        }
      } catch (error) {
        console.error("Failed to fetch students", error);
        setNoStudentsMessage("Failed to load students. Please try again.");
        toast.error("Failed to load students");
      } finally {
        setIsLoadingStudents(false);
      }
    };

    if ((assessmentType === 'exam' && selectedExamId) || (assessmentType === 'assignment' && selectedAssignmentId)) {
      loadStudents();
    } else {
      setStudents([]);
      setNoStudentsMessage("");
      setIsLoadingStudents(false);
    }
  }, [selectedExamId, selectedAssignmentId, assessmentType, exams, assignments]);

  const [state, formAction] = useFormState(
    type === "create" ? createResult : updateResult,
    { success: false, error: false }
  );

  const onSubmit = handleSubmit((formData) => {
    // Clean up the form data to ensure proper values
    const cleanedData = {
      ...formData,
      examId: assessmentType === 'exam' ? formData.examId : undefined,
      assignmentId: assessmentType === 'assignment' ? formData.assignmentId : undefined,
    };
    formAction(cleanedData);
  });

  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      toast(`Result has been ${type === "create" ? "created" : "updated"}!`);
      setOpen(false);
      router.refresh();
    }
  }, [state, router, type, setOpen]);

  const selectedExam = exams.find(exam => exam.id === selectedExamId);
  const selectedAssignment = assignments.find(assignment => assignment.id === selectedAssignmentId);
  const selectedAssessment = assessmentType === 'exam' ? selectedExam : selectedAssignment;

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Record a result" : "Update result"}
      </h1>
      
      <form onSubmit={onSubmit} className="flex flex-col gap-8">
        <div className="flex justify-between flex-wrap gap-4">
          {/* Assessment Type Selection */}
          <div className="flex flex-col gap-2 w-full md:w-1/4">
            <label className="text-xs text-gray-500">Assessment Type</label>
            <select
              className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
              value={assessmentType}
              onChange={(e) => {
                const newType = e.target.value as 'exam' | 'assignment';
                setAssessmentType(newType);
                // Reset selections when switching types
                setSelectedExamId(undefined);
                setSelectedAssignmentId(undefined);
                setStudents([]);
              }}
            >
              <option value="exam">Exam</option>
              <option value="assignment">Assignment</option>
            </select>
          </div>

          {/* Assessment Selection */}
          <div className="flex flex-col gap-2 w-full md:w-1/3">
            <label className="text-xs text-gray-500">
              {assessmentType === 'exam' ? 'Exam' : 'Assignment'}
            </label>
            {assessmentType === 'exam' ? (
              <select
                className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
                {...register("examId")}
                onChange={(e) => {
                  const value = Number(e.target.value) || undefined;
                  setSelectedExamId(value);
                  setSelectedAssignmentId(undefined);
                }}
                value={selectedExamId || ""}
              >
                <option value="">Select an exam</option>
                {exams.map((exam) => (
                  <option key={exam.id} value={exam.id}>
                    {exam.title}
                  </option>
                ))}
              </select>
            ) : (
              <select
                className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
                {...register("assignmentId")}
                onChange={(e) => {
                  const value = Number(e.target.value) || undefined;
                  setSelectedAssignmentId(value);
                  setSelectedExamId(undefined);
                }}
                value={selectedAssignmentId || ""}
              >
                <option value="">Select an assignment</option>
                {assignments.map((assignment) => (
                  <option key={assignment.id} value={assignment.id}>
                    {assignment.title}
                  </option>
                ))}
              </select>
            )}
            {errors.examId?.message && (
              <p className="text-xs text-red-400">{errors.examId.message}</p>
            )}
          </div>

          {/* Student select */}
          <div className="flex flex-col gap-2 w-full md:w-1/3">
            <label className="text-xs text-gray-500">Student</label>
            <select
              className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
              {...register("studentId")}
              disabled={isLoadingStudents}
            >
              {isLoadingStudents ? (
                <option value="">Loading students...</option>
              ) : noStudentsMessage ? (
                <option value="">{noStudentsMessage}</option>
              ) : students.length === 0 ? (
                <option value="">Select an {assessmentType} first</option>
              ) : (
                <>
                  <option value="">Select a student</option>
                  {students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.name} {student.surname}
                    </option>
                  ))}
                </>
              )}
            </select>
            {errors.studentId?.message && (
              <p className="text-xs text-red-400">{errors.studentId.message}</p>
            )}
            {noStudentsMessage && !isLoadingStudents && (
              <p className="text-xs text-blue-600">{noStudentsMessage}</p>
            )}
          </div>

          {/* Score input */}
          <div className="flex flex-col gap-2 w-full md:w-1/4">
            <label className="text-xs text-gray-500">
              Score {selectedAssessment && `(Max: ${selectedAssessment.maxPoints || 100})`}
            </label>
            <input
              type="number"
              className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
              {...register("score", { valueAsNumber: true })}
              min={0}
              max={selectedAssessment?.maxPoints || 100}
            />
            {errors.score?.message && (
              <p className="text-xs text-red-400">{errors.score.message}</p>
            )}
          </div>

          {/* Feedback textarea */}
          <div className="flex flex-col gap-2 w-full">
            <label className="text-xs text-gray-500">Feedback (Optional)</label>
            <textarea
              className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
              {...register("feedback")}
            />
            {errors.feedback?.message && (
              <p className="text-xs text-red-400">{errors.feedback.message}</p>
            )}
          </div>
        </div>

        <button
          type="submit"
          className="p-2 bg-lamaPurple text-white rounded-md w-full hover:bg-lamaPurpleDark"
        >
          Submit
        </button>
      </form>
    </div>
  );
}