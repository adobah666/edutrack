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
  fetchExams
} from "@/lib/actions";

const resultSchema = z.object({
  id: z.coerce.number().optional(),
  score: z.coerce.number().min(0, { message: "Score must be a positive number!" }),
  studentId: z.string().min(1, { message: "Student is required!" }),
  examId: z.coerce.number().min(1, { message: "Exam is required!" }),
  feedback: z.string().optional(),
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
  const [selectedExamId, setSelectedExamId] = useState<number | undefined>(data?.examId);
  const [isLoading, setIsLoading] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<ResultSchema>({
    resolver: zodResolver(resultSchema),
    defaultValues: data
  });

  // Fetch exams on component mount
  useEffect(() => {
    const loadExams = async () => {
      try {
        const fetchedExams = await fetchExams();
        setExams(fetchedExams);
        setIsLoading(false);
      } catch (error) {
        console.error("Failed to fetch exams", error);
        setIsLoading(false);
        toast.error("Failed to load exams");
      }
    };
    loadExams();
  }, []);

  // Fetch students when an exam is selected
  useEffect(() => {
    const loadStudents = async () => {
      try {
        const selectedExam = exams.find(exam => exam.id === selectedExamId);
        if (selectedExam?.classId) {
          const fetchedStudents = await fetchStudents();
          
          // Fetch existing results for this exam
          const response = await fetch(`/api/results?examId=${selectedExamId}`);
          if (!response.ok) {
            throw new Error("Failed to fetch exam results");
          }
          const existingResults = await response.json();
          const studentsWithResults = new Set(existingResults.map((result: any) => result.studentId));
          
          // Filter students for the selected exam's class and exclude those who already have results
          const classStudents = fetchedStudents.filter(student => 
            student.classId === selectedExam.classId && !studentsWithResults.has(student.id)
          );
          
          setStudents(classStudents);
        } else {
          setStudents([]);
        }
      } catch (error) {
        console.error("Failed to fetch students", error);
        toast.error("Failed to load students");
      }
    };

    if (selectedExamId) {
      loadStudents();
    } else {
      setStudents([]);
    }
  }, [selectedExamId, exams]);

  const [state, formAction] = useFormState(
    type === "create" ? createResult : updateResult,
    { success: false, error: false }
  );

  const onSubmit = handleSubmit((formData) => {
    formAction(formData);
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
          {/* Exam select */}
          <div className="flex flex-col gap-2 w-full md:w-1/3">
            <label className="text-xs text-gray-500">Exam</label>
            <select
              className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
              {...register("examId", { valueAsNumber: true })}
              onChange={(e) => setSelectedExamId(Number(e.target.value) || undefined)}
              value={selectedExamId || ""}
            >
              <option value="">Select an exam</option>
              {exams.map((exam) => (
                <option key={exam.id} value={exam.id}>
                  {exam.title}
                </option>
              ))}
            </select>
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
            >
              <option value="">Select a student</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.name} {student.surname}
                </option>
              ))}
            </select>
            {errors.studentId?.message && (
              <p className="text-xs text-red-400">{errors.studentId.message}</p>
            )}
          </div>

          {/* Score input */}
          <div className="flex flex-col gap-2 w-full md:w-1/4">
            <label className="text-xs text-gray-500">
              Score {selectedExam && `(Max: ${selectedExam.maxPoints || 100})`}
            </label>
            <input
              type="number"
              className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
              {...register("score", { valueAsNumber: true })}
              min={0}
              max={selectedExam?.maxPoints || 100}
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